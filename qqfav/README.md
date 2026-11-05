# qqfav — 一键收藏「正在播放」到本季歌单

把当前正在播放的歌曲，写进一个按**季度**命名的自建歌单：`2026Q4`、`2026Q3`……
歌单不存在时自动创建，重复收藏自动跳过。

## 两个功能

| 功能 | 命令 | 说明 |
|---|---|---|
| 一、收藏当前播放 | `qqfav now` | 自动识别正在放的歌，无需任何参数 |
| 二、收藏指定歌曲 | `qqfav song ...` | 用 `--mid` / `--text` / `--clipboard` 指定 |

两个功能共用「目标歌单 + 判重 + 读回确认」这套写入流程，
只是取歌的来源不同：`now` 去问系统/客户端，`song` 由你直接给。

## 快速开始

```bash
cd <qqmusic-plugin>/qqfav        # 本工具位于 QQ 音乐插件的 qqfav/ 子目录

./bin/qqfav check                                  # 诊断：登录态 / 歌单 / 正在播放
./bin/qqfav now                                    # 收藏当前播放
./bin/qqfav song --text "告白气球 周杰伦"            # 收藏指定歌曲
./bin/qqfav list                                   # 看看本季歌单都收了什么
```

出错或不确定的时候先跑 `check`。

## 歌单命名

按自然季度换算，今天就落在 **2026Q4**：

| 月份 | 季度 |
|---|---|
| 1–3 | Q1 |
| 4–6 | Q2 |
| 7–9 | Q3 |
| 10–12 | Q4 |

规则是 `f"{年}Q{季度}"`。想临时改目标歌单，加 `--playlist 名字`。

## 用法

**功能一：当前播放**

```bash
./bin/qqfav now                    # 等价于 ./bin/qqfav
./bin/qqfav now --notify           # 收完弹系统通知
./bin/qqfav --dry-run              # 只看识别到哪首，不写
```

**功能二：指定歌曲**

```bash
./bin/qqfav song --mid 003OUlho2HcRHC        # 直接给 mid
./bin/qqfav song --text "告白气球 周杰伦"      # 按「歌名 歌手」搜
./bin/qqfav song --clipboard                 # 从剪贴板的分享链接取
```

**两个功能都支持**

```bash
--playlist "Jay"    # 换目标歌单（默认按季度）
--dry-run           # 只显示要做什么，不写入
--notify            # 完成后弹 macOS 通知
```

## 快捷方式

**A. 系统快捷键（推荐，零依赖）**

1. 打开「快捷指令 / Shortcuts」→ 新建
2. 加一个「运行 Shell 脚本」动作，内容填本机 `qqfav/hotkey.sh` 的绝对路径
   （如 `~/myprojects/qqmusic-plugin/qqfav/hotkey.sh`，内部就是 `qqfav now --notify`）
3. 右侧「信息」面板勾选「用作快速操作」，分配一个键盘快捷键

**B. Raycast**：新建 Script Command，模板选 Shell，脚本内容同上。

**C. 本地 HTTP（给浏览器书签/其他脚本用）**

```bash
./bin/qqfav serve --port 8765
# 功能一： http://127.0.0.1:8765/now
# 功能二： http://127.0.0.1:8765/song?text=歌名%20歌手
#         http://127.0.0.1:8765/song?mid=003OUlho2HcRHC
# 加 &dry=1 试运行
```

## 原理

走的是 QQ 音乐 Web 端的内部 RPC `https://u.y.qq.com/cgi-bin/musicu.fcg`，
一个 JSON 信封里 `comm` 带公参、`req` 指定 `module/method`：

| 步骤 | module / method |
|---|---|
| 列出我的歌单 | `music.musicasset.PlaylistBaseRead` / `GetPlaylistByUin` |
| 创建歌单 | `music.musicasset.PlaylistBaseWrite` / `AddPlaylist` |
| 歌单加歌 | `music.musicasset.PlaylistDetailWrite` / `AddSonglist` |
| 读歌单曲目 | `music.srfDissInfo.DissInfo` / `CgiGetDiss` |
| 搜索歌曲 | `music.search.SearchCgiService` / `DoSearchForQQMusicDesktop` |

注意 `AddSonglist` 要传**数字 songId**（不是 mid）+ `songType`。

### 「正在播放」的两条来源

按顺序尝试，前者失败自动落到后者：

1. **系统 Now Playing**：macOS `MediaRemote` 私有框架，`src/nowplaying.swift`
   编译成 `bin/nowplaying`。返回结果标记 `[media-remote]`。
2. **客户端本地状态**（实测用这条）：读
   `iUser/<uin>/recent_gy_records.data`（NSKeyedArchiver 数组，首元素是最近播放的数字 songId），
   并与 `iMusic/<xx>/<songId>-<q>.mflac` 缓存文件的 mtime 交叉校验，两者一致即采信，
   再去接口换回 mid/标题。返回结果标记 `[app-state]`。

实测本机 QQ 音乐 11.10.5 **不向系统注册 Now Playing**（`nowPlayingPID = 0`），
所以实际生效的是第 2 条。

## 登录态

默认直接读本机 QQ 音乐客户端已登录的账号（`~/Library/Preferences/com.tencent.QQMusicMac.plist`
里的 `AutoLoginUserInfo`），**不落盘、不打印**。Token 只在该进程内存里用于请求头。

也可以手动指定：

```bash
./bin/qqfav --cookie 'uin=o0875083146; qm_keyst=...' check
# 或写进 ~/.config/qqfav/cookie.txt（记得 chmod 600）
```

## 依赖

- Python 3（仅标准库）
- macOS + 已登录的 QQ 音乐客户端
- `swiftc`（仅首次编译 nowplaying 时需要）

重新编译通知读取工具：

```bash
mkdir -p build/modcache
TMPDIR=$PWD/build swiftc -O -module-cache-path $PWD/build/modcache \
  -Xcc -fmodules-cache-path=$PWD/build/modcache \
  src/nowplaying.swift -o bin/nowplaying
```

## 已知限制

- **「正在播放」是推断出来的**：客户端本地状态只反映「最近一首」，暂停/刚切歌时可能滞后一两秒；
  两个信号都拿不到时会提示改用 `--mid` / `--text` / `--clipboard`。
- **登录态会过期**：客户端重新登录后 token 更新，本工具下次运行自动读到新的。
- **非官方接口**：`musicu.fcg` 是逆向出来的内部协议，随时可能变；不保证长期可用。
- 只做「往自己的歌单加歌」，不涉及付费内容、不绕过任何会员限制。
