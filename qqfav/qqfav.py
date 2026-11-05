#!/usr/bin/env python3
"""qqfav — 把当前播放的歌曲收藏进按季度命名的自建歌单。

歌单命名规则: f"{年}Q{季度}", 例: 2026Q4。
依赖: 仅 Python 3 标准库 + macOS 上的 QQ 音乐客户端登录态。
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import plistlib
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENDPOINT = "https://u.y.qq.com/cgi-bin/musicu.fcg"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
HOME = Path.home()
QMCONF = HOME / "Library/Preferences/com.tencent.QQMusicMac.plist"
COOKIE_FILE = HOME / ".config/qqfav/cookie.txt"
ROOT = Path(__file__).resolve().parent
NP_BIN = ROOT / "bin/nowplaying"
NP_SRC = ROOT / "src/nowplaying.swift"

M_READ = "music.musicasset.PlaylistBaseRead"
M_BASE = "music.musicasset.PlaylistBaseWrite"
M_DETAIL = "music.musicasset.PlaylistDetailWrite"
M_DISS = "music.srfDissInfo.DissInfo"
M_SEARCH = "music.search.SearchCgiService"


class QQError(RuntimeError):
    """业务错误。"""


# ---------------------------------------------------------------- 登录态


def _decode_accounts(path: Path) -> list[dict]:
    """从 QQ 音乐偏好中解出本地登录账号（NSKeyedArchiver）。"""
    raw = plistlib.load(open(path, "rb")).get("AutoLoginUserInfo")
    if not raw:
        return []
    arc = plistlib.loads(raw)
    objs = arc.get("$objects", [])

    def deref(v):
        return objs[v.data] if isinstance(v, plistlib.UID) else v

    root = deref(arc["$top"]["root"])
    out = []
    for u in deref(root["userArray"])["NS.objects"]:
        item = deref(u)
        rec = {k: deref(v) for k, v in item.items() if not k.startswith("$")}
        if rec.get("nUserId") and rec.get("strAuthst"):
            out.append(rec)
    return out


def load_auth(cookie_arg: str | None = None) -> tuple[int, str]:
    """返回 (uin, musickey)。优先级: 命令行 > 环境变量 > Cookie 文件 > 客户端登录态。"""
    raw = cookie_arg or os.environ.get("QQFAV_COOKIE", "")
    if not raw and COOKIE_FILE.exists():
        raw = COOKIE_FILE.read_text(encoding="utf-8").strip()
    if raw:
        jar = {}
        for part in raw.replace("; ", ";").split(";"):
            if "=" in part:
                k, v = part.split("=", 1)
                jar[k.strip()] = v.strip()
        key = jar.get("qm_keyst") or jar.get("qqmusic_key") or jar.get("musickey")
        uin = jar.get("uin") or jar.get("qqmusic_uin") or ""
        uin = re.sub(r"\D", "", uin)
        if key and uin:
            return int(uin), key
        raise QQError("Cookie 里缺少 uin 或 qm_keyst（qqmusic_key）")

    if QMCONF.exists():
        accounts = _decode_accounts(QMCONF)
        if accounts:
            acc = accounts[0]
            return int(acc["nUserId"]), acc["strAuthst"]
    raise QQError(
        "找不到登录态：既没读到 QQ 音乐客户端的登录信息，也没有 Cookie。\n"
        "  办法 1: 打开并登录 QQ 音乐客户端（macOS 版）后重试\n"
        "  办法 2: qqfav --cookie 'uin=o0...; qm_keyst=...'"
    )


def hash33(s: str, h: int = 5381) -> int:
    for c in s:
        h = (h << 5) + h + ord(c)
    return 2147483647 & h


# ---------------------------------------------------------------- 请求


class Api:
    def __init__(self, uin: int, key: str, *, timeout: int = 20):
        self.uin, self.key, self.timeout = uin, key, timeout
        self.gtk = hash33(key)

    def _comm(self) -> dict:
        return {
            "ct": "24",
            "cv": "4747474",
            "platform": "yqq.json",
            "chid": "0",
            "uin": str(self.uin),
            "g_tk": str(self.gtk),
            "g_tk_new_20200303": str(self.gtk),
            "format": "json",
            "inCharset": "utf-8",
            "outCharset": "utf-8",
            "notice": "0",
            "need_new_code": "1",
        }

    def call(self, module: str, method: str, param: dict) -> dict:
        body = json.dumps(
            {"comm": self._comm(), "req": {"module": module, "method": method, "param": param}},
            ensure_ascii=False,
        ).encode()
        req = urllib.request.Request(
            ENDPOINT,
            data=body,
            headers={
                "Content-Type": "application/json",
                "Referer": "https://y.qq.com/",
                "User-Agent": UA,
                "Cookie": f"uin=o0{self.uin}; qm_keyst={self.key}",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as fh:
                payload = json.load(fh)
        except urllib.error.HTTPError as e:
            raise QQError(f"HTTP {e.code}：{module}/{method}") from e
        except urllib.error.URLError as e:
            raise QQError(f"网络错误：{e.reason}") from e

        if payload.get("code") != 0:
            raise QQError(f"外层错误 code={payload.get('code')}（{module}/{method}）")
        inner = payload.get("req", {})
        code = inner.get("code")
        if code == 1000 or code == 301:
            raise QQError("登录态失效，请重新登录 QQ 音乐客户端")
        if code != 0:
            hint = {80105: "写入被服务端拒绝（业务码 80105）"}.get(code, "业务错误")
            raise QQError(f"{hint} code={code}（{module}/{method}）")
        data = inner.get("data") or {}
        ret = data.get("retCode")
        if ret not in (None, 0):
            raise QQError(f"retCode={ret}（{module}/{method}）")
        return data

    # -- 歌单读 --
    def playlists(self) -> list[dict]:
        data = self.call(M_READ, "GetPlaylistByUin", {"uin": str(self.uin)})
        return data.get("v_playlist") or []

    def playlist_songs(self, dirid: int, tid: int) -> list[dict]:
        """取歌单全部曲目（按需翻页）。"""
        songs: list[dict] = []
        begin = 0
        while True:
            data = self.call(
                M_DISS,
                "CgiGetDiss",
                {
                    "disstid": tid,
                    "dirid": dirid,
                    "tag": True,
                    "song_begin": begin,
                    "song_num": 300,
                    "userinfo": True,
                    "orderlist": True,
                },
            )
            batch = data.get("songlist") or []
            songs.extend(batch)
            begin += len(batch)
            if not batch or not data.get("hasmore") or begin >= int(data.get("total_song_num") or 0):
                break
        return songs

    # -- 歌单写 --
    def create_playlist(self, name: str) -> dict:
        data = self.call(
            M_BASE,
            "AddPlaylist",
            {"dirName": name, "dirDesc": "", "dirPicUrl": "", "taglist": "", "dirShow": 2},
        )
        result = data.get("result") or {}
        if not result.get("dirId"):
            raise QQError(f"创建歌单失败，返回：{json.dumps(data, ensure_ascii=False)[:200]}")
        return result

    def add_songs(self, dirid: int, tid: int, songs: list[tuple[int, int]]) -> None:
        self.call(
            M_DETAIL,
            "AddSonglist",
            {
                "dirId": dirid,
                "tid": tid,
                "bFmtUtf8": True,
                "v_songInfo": [{"songId": sid, "songType": stype} for sid, stype in songs],
            },
        )


# ---------------------------------------------------------------- 歌曲解析


def normalize(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[（(].*?[)）]", "", s)
    return re.sub(r"[\s\-_·・,，.。!！?？'\"“”‘’]+", "", s)


def search_song(api: Api, text: str) -> dict:
    data = api.call(
        M_SEARCH,
        "DoSearchForQQMusicDesktop",
        {"query": text, "num_per_page": 8, "page_num": 1, "search_type": 0},
    )
    songs = (((data.get("body") or {}).get("song") or {}).get("list")) or []
    if not songs:
        raise QQError(f"搜不到这首歌：{text}")

    # 优先取标题完全命中的那条（整串或首个词），否则沿用接口的相关度排序
    tokens = [t for t in re.split(r"[\s\-]+", text.strip()) if t]
    wants = {normalize(text)}
    if tokens:
        wants.add(normalize(tokens[0]))
    best = next((s for s in songs if normalize(s.get("title", "")) in wants), songs[0])

    best = dict(best)
    best["singer"] = "/".join(x.get("name", "") for x in (best.get("singer") or []))
    return best


def _media_remote() -> dict | None:
    """系统 Now Playing（MediaRemote）。读不到返回 None。"""
    if not NP_BIN.exists():
        return None
    try:
        out = subprocess.run([str(NP_BIN)], capture_output=True, text=True, timeout=10)
        info = json.loads(out.stdout or "{}")
    except Exception:
        return None
    if not info.get("title"):
        return None
    return {"title": info["title"], "artist": info.get("artist") or "", "confidence": "media-remote"}


def _app_state_songid() -> int | None:
    """从 QQ 音乐客户端本地状态取当前歌曲的数字 ID。

    依据两个独立信号：
      1. iUser/<uin>/recent_gy_records.data —— NSKeyedArchiver 数组，首个元素是最近播放
      2. iMusic/<xx>/<songId>-<q>.mflac —— 缓存/CDN 文件 mtime 最新者
    两者一致时置信度最高。
    """
    base = HOME / "Library/Containers/com.tencent.QQMusicMac/Data/Library/Application Support/QQMusicMac"
    latest: int | None = None
    for f in (base / "iUser").glob("*/recent_gy_records.data"):
        try:
            arc = plistlib.loads(f.read_bytes())
            arr = arc["$objects"][1]["NS.objects"]
            first = arc["$objects"][arr[0].data]
            if isinstance(first, int) and first > 0:
                latest = first
        except Exception:
            continue

    newest_file: int | None = None
    newest_mtime = 0.0
    for p in (base / "iMusic").glob("*/*.mflac"):
        try:
            m = re.match(r"(\d{6,})-", p.name)
            if not m:
                continue
            mt = p.stat().st_mtime
            if mt > newest_mtime:
                newest_mtime, newest_file = mt, int(m.group(1))
        except OSError:
            continue
    # 缓存文件过旧（>30 分钟）就不作数
    if newest_file and (dt.datetime.now().timestamp() - newest_mtime) > 1800:
        newest_file = None

    if latest and latest == newest_file:
        return latest
    return latest or newest_file


def now_playing(api: "Api | None" = None) -> dict | None:
    """读取「正在播放」。先试系统 Now Playing，再退到客户端本地状态。"""
    got = _media_remote()
    if got:
        return got

    sid = _app_state_songid()
    if not sid or api is None:
        return None
    try:
        d = api.call("music.pf_song_detail_svr", "get_song_detail", {"song_id": sid})
        t = d.get("track_info") or {}
    except QQError:
        return None
    if not t.get("name"):
        return None
    return {
        "title": t["name"],
        "artist": "/".join(x.get("name", "") for x in (t.get("singer") or [])),
        "id": t.get("id") or sid,
        "mid": t.get("mid"),
        "type": t.get("type", 0),
        "confidence": "app-state",
    }


def quarter_name(today: dt.date | None = None) -> str:
    today = today or dt.date.today()
    return f"{today.year}Q{(today.month - 1) // 3 + 1}"


def clipboard_mid() -> str | None:
    """从剪贴板里的 QQ 音乐分享链接中取歌曲 mid。"""
    try:
        text = subprocess.run(["pbpaste"], capture_output=True, text=True, timeout=5).stdout
    except Exception:
        return None
    m = re.search(r"songDetail/([0-9A-Za-z]{10,})", text) or re.search(r"songmid=([0-9A-Za-z]{10,})", text)
    return m.group(1) if m else None


def _song_by_mid(api: Api, mid: str, origin: str) -> tuple[dict, str]:
    """按 mid 取歌曲详情。"""
    data = api.call("music.pf_song_detail_svr", "get_song_detail", {"song_mid": mid})
    d = (data.get("track_info") or {})
    if not d.get("id"):
        raise QQError(f"查不到这个 mid 对应的歌曲：{mid}")
    return {
        "title": d.get("name", ""),
        "mid": mid,
        "id": d.get("id"),
        "type": d.get("type", 0),
        "singer": "/".join(x.get("name", "") for x in (d.get("singer") or [])),
    }, origin


def resolve_now(api: Api) -> tuple[dict, str]:
    """功能一：取「当前播放」的歌曲。"""
    np = now_playing(api)
    if not np:
        raise QQError(
            "读不到「正在播放」。\n"
            "  · 确认 QQ 音乐客户端正在播放（暂停状态读不到）\n"
            "  · 想收指定歌曲请用：qqfav song --text / --mid / --clipboard"
        )
    if np.get("id"):
        # 本地状态已给出数字 ID，直接用，不必再搜索（避免搜到翻唱/Live 版）
        return {
            "title": np["title"],
            "mid": np.get("mid"),
            "id": np["id"],
            "type": np.get("type", 0),
            "singer": np.get("artist", ""),
        }, f"正在播放「{np['title']}」（{np['confidence']}）"

    query = f"{np['title']} {np['artist']}".strip()
    return search_song(api, query), f"正在播放「{np['title']}」（{np['confidence']}）"


def resolve_song(api: Api, args) -> tuple[dict, str]:
    """功能二：取「指定」的歌曲（mid / 关键词 / 剪贴板链接）。"""
    if args.mid:
        return _song_by_mid(api, args.mid, "手动 mid")
    if args.clipboard:
        mid = clipboard_mid()
        if not mid:
            raise QQError("剪贴板里没找到 QQ 音乐歌曲链接（形如 https://y.qq.com/n/ryqq/songDetail/<mid>）")
        return _song_by_mid(api, mid, "剪贴板链接")
    if args.text:
        return search_song(api, args.text), f"搜索「{args.text}」"
    raise QQError("请用 --mid <歌曲mid>、--text \"歌名 歌手\" 或 --clipboard 指定歌曲")


# ---------------------------------------------------------------- 主流程


def notify(msg: str, args=None) -> None:
    """macOS 通知中心提示（仅在 --notify 时）。"""
    if not getattr(args, "notify", False) or sys.platform != "darwin":
        return
    try:
        subprocess.run(
            ["osascript", "-e",
             f"display notification {json.dumps(msg, ensure_ascii=False)} with title \"qqfav\""],
            capture_output=True, timeout=5, check=False,
        )
    except Exception:
        pass


def ensure_playlist(api: Api, name: str) -> dict:
    for pl in api.playlists():
        if (pl.get("dirName") or "") == name:
            return {"dirId": int(pl["dirId"]), "tid": int(pl["tid"]), "dirName": name, "created": False}
    created = api.create_playlist(name)
    found = {"dirId": int(created["dirId"]), "tid": int(created.get("tid") or 0), "dirName": name, "created": True}
    if not found["tid"]:
        for pl in api.playlists():
            if (pl.get("dirName") or "") == name:
                return {"dirId": int(pl["dirId"]), "tid": int(pl["tid"]), "dirName": name, "created": True}
    return found


def _commit(api: Api, song: dict, origin: str, args) -> int:
    """公共写入流程：确认歌单 → 判重 → 加歌 → 读回。"""
    if not song.get("id"):
        raise QQError("拿不到歌曲数字 ID，无法写入")
    song_id, song_type = int(song["id"]), int(song.get("type") or 0)
    pl_name = args.playlist or quarter_name()

    label = f"{song.get('title')} — {song.get('singer')}"
    print(f"歌曲   {label}  (id={song_id}, mid={song.get('mid')})")
    print(f"来源   {origin}")
    print(f"目标歌单 {pl_name}")

    if args.dry_run:
        print("\n[dry-run] 未写入")
        return 0

    pl = ensure_playlist(api, pl_name)
    print(f"歌单   dirId={pl['dirId']} tid={pl['tid']}" + ("  (新建)" if pl["created"] else "  (已存在)"))

    existing = api.playlist_songs(pl["dirId"], pl["tid"])
    if song_id in {int(s.get("id") or 0) for s in existing}:
        print(f"\n已在歌单中，跳过（共 {len(existing)} 首）。")
        notify(f"已在「{pl_name}」：{label}", args)
        return 0

    api.add_songs(pl["dirId"], pl["tid"], [(song_id, song_type)])

    after = api.playlist_songs(pl["dirId"], pl["tid"])
    if song_id not in {int(s.get("id") or 0) for s in after}:
        raise QQError("写入后读回未发现该歌曲，可能未生效")

    print(f"\n✅ 已加入「{pl_name}」，当前 {len(after)} 首（原 {len(existing)} 首）。")
    notify(f"已加入「{pl_name}」（{len(after)} 首）：{label}", args)
    return 0


def cmd_now(api: Api, args) -> int:
    """功能一：收藏当前播放的歌曲。"""
    song, origin = resolve_now(api)
    return _commit(api, song, origin, args)


def cmd_song(api: Api, args) -> int:
    """功能二：收藏指定的歌曲。"""
    song, origin = resolve_song(api, args)
    return _commit(api, song, origin, args)


def cmd_list(api: Api, args) -> int:
    name = args.playlist or quarter_name()
    pl = None
    for p in api.playlists():
        if (p.get("dirName") or "") == name:
            pl = p
            break
    if not pl:
        print(f"歌单「{name}」还不存在。")
        return 0
    songs = api.playlist_songs(int(pl["dirId"]), int(pl["tid"]))
    print(f"「{name}」 共 {len(songs)} 首\n")
    for i, s in enumerate(songs, 1):
        singers = "/".join(x.get("name", "") for x in (s.get("singer") or []))
        print(f"{i:3d}. {s.get('title') or s.get('name')} — {singers}")
    return 0


def cmd_check(api: Api, args) -> int:
    print(f"季度命名  {quarter_name()}")
    pls = api.playlists()
    print(f"登录态    正常（uin={api.uin}，{len(pls)} 个歌单）")
    target = quarter_name()
    hit = [p for p in pls if (p.get("dirName") or "") == target]
    if hit:
        print(f"当前歌单  「{target}」已存在 dirId={hit[0]['dirId']} tid={hit[0]['tid']}")
    else:
        print(f"当前歌单  「{target}」不存在，首次使用时会自动创建")
    np = now_playing(api)
    if np:
        print(f"正在播放  {np['title']} — {np['artist']}  [{np['confidence']}]")
    else:
        print("正在播放  读不到（暂停/未播放）")
    return 0


def cmd_serve(api: Api, args) -> int:
    """极简 HTTP 服务，供快捷键/浏览器/其他脚本调用。"""
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    from urllib.parse import parse_qs, urlparse

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            u = urlparse(self.path)
            qs = parse_qs(u.query)
            one = lambda k: qs.get(k, [None])[0]
            try:
                ns = argparse.Namespace(
                    playlist=one("playlist"), dry_run=bool(one("dry")),
                    notify=False, mid=one("mid"), text=one("text"),
                    clipboard=not any([one("mid"), one("text")]),
                )
                if u.path in ("/now", "/add"):
                    ns.clipboard = False
                    cmd_now(api, ns)
                    body = json.dumps({"ok": True, "action": "now"}, ensure_ascii=False)
                    code = 200
                elif u.path == "/song":
                    cmd_song(api, ns)
                    body = json.dumps({"ok": True, "action": "song"}, ensure_ascii=False)
                    code = 200
                else:
                    body, code = json.dumps(
                        {"ok": False, "error": "未知路径，可用：/now 或 /song?mid= | ?text="},
                        ensure_ascii=False), 404
            except QQError as e:
                body, code = json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False), 500
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(body.encode())

        def log_message(self, *a):
            pass

    print(f"qqfav 服务已启动: http://127.0.0.1:{args.port}/now  |  /song?mid=...  (Ctrl+C 退出)")
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        prog="qqfav",
        description="把歌曲收藏进按季度命名的自建歌单",
        epilog="两个功能：now = 收当前播放；song = 收指定歌曲",
    )
    ap.add_argument("--cookie", help="Cookie 字符串（uin=...; qm_keyst=...）")
    sub = ap.add_subparsers(dest="cmd")

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--playlist", help="覆盖目标歌单名（默认按季度）")
    common.add_argument("--dry-run", action="store_true", help="只显示将要做什么")
    common.add_argument("--notify", action="store_true", help="完成后弹 macOS 通知")

    # 功能一：当前播放
    p = sub.add_parser("now", parents=[common], aliases=["add"], help="收藏当前正在播放的歌曲")
    p.set_defaults(func=cmd_now)

    # 功能二：指定歌曲
    p = sub.add_parser("song", parents=[common], help="收藏指定的歌曲")
    p.add_argument("--mid", help="歌曲 mid，例：003OUlho2HcRHC")
    p.add_argument("--text", help="按「歌名 歌手」搜索")
    p.add_argument("--clipboard", action="store_true", help="从剪贴板的分享链接取歌")
    p.set_defaults(func=cmd_song)

    p = sub.add_parser("list", help="列出当前季度歌单曲目")
    p.add_argument("--playlist", help="覆盖歌单名（默认按季度）")
    p.set_defaults(func=cmd_list)

    p = sub.add_parser("check", help="诊断登录态/歌单/正在播放")
    p.set_defaults(func=cmd_check)

    p = sub.add_parser("serve", help="启动本地 HTTP 服务给快捷键调用")
    p.add_argument("--port", type=int, default=8765)
    p.set_defaults(func=cmd_serve)

    # 不带子命令 = 收藏当前播放；允许直接 qqfav --dry-run / qqfav --playlist X
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv:
        argv = ["now"]
    elif argv[0] in ("--dry-run", "--notify") or argv[0].startswith("--playlist"):
        argv = ["now"] + argv

    args = ap.parse_args(argv)
    if not getattr(args, "func", None):
        args.func = cmd_now

    try:
        api = Api(*load_auth(args.cookie))
        return args.func(api, args)
    except QQError as e:
        print(f"错误：{e}", file=sys.stderr)
        notify(f"失败：{e}", args)
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
