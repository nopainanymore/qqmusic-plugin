# QQ 音乐 · Harness 插件

在 DeepSeek Harness 的 Web 界面里直接使用你自己的 QQ 音乐账号：搜索、播放、浏览歌单、看歌词，并把正在播放的歌一键收进按季度命名的歌单。

侧边栏的音符图标直接进入主页：每日推荐和猜你喜欢左右两栏，歌单是唯一的分区入口。底部是常驻播放器——进度、上一首/下一首、播放模式（顺序/列表循环/单曲循环/随机）、收藏、音质、音量、播放队列都在这一条里，展开后是完整的「正在播放」页。播放器独立于面板生命周期，切换到对话或其他页面时音乐继续播放。

## 功能

| 能力 | 说明 |
|---|---|
| 登录态 | 直接读取 macOS QQ 音乐客户端已登录的账号，不落盘、不打印 token |
| 搜索 | 歌曲 / 歌手 / 专辑关键词搜索，最多 50 条 |
| 播放 | 播放 / 暂停 / 上一首 / 下一首 / 进度拖动 / 音量 / 单曲循环，队列即当前列表 |
| 歌单 | 封面网格 + 名字筛选；本季收藏置顶，点开即加载曲目、可整单播放 |
| 主页 | 每日30首（按上海日期校验）与猜你喜欢（16 首，当天缓存，只有「换一批」才换）左右两栏，下面是推荐歌单 |
| 音质 | 标准 128k / 高品质 320k / 无损；播放中切换保留进度，不可用时自动降级并在播放条显示实际音质 |
| 常驻播放器 | 底部常驻：封面/歌名/收藏、进度条与时间、上一首/播放/下一首、播放模式（顺序/列表循环/单曲循环/随机）、音质、音量、播放队列、展开播放页 |
| 本季收藏 | 把当前播放或系统「正在播放」写进 `2026Q4`；不存在自动创建、已存在自动跳过、写完读回确认 |
| 播放页 | 大封面 + 随封面着色的背景 + 逐行歌词（点歌词跳到该句）+ 进度 / 音量 / 循环 / 音质 |
| 手动登录 | 粘贴 `uin=...; qm_keyst=...` 即可临时换号（只存在 Host 进程内存） |

## 安装

需要 macOS（系统「正在播放」与 QQ 音乐客户端登录态都依赖它）和一份能正常启动的 DeepSeek Harness。

**Desktop 版**：侧边栏「插件」页 → 安装 → 填仓库地址。Desktop 的 profile 由应用自己持有，命令行 `dsh plugin --profile desktop` 会被拒绝，请用插件页操作。

**Web / CLI 版**：

```sh
dsh plugin --profile web add git+https://github.com/nopainanymore/qqmusic-plugin.git
```

装完确认 profile 的 `dsh.profile.bundles` 里出现 `@local/qqmusic`，然后刷新页面；没有启用 HMR 时需要重启 dsh。侧边栏出现音符图标即安装成功。

本地开发用绝对路径安装，改完重载即可：

```sh
dsh plugin --profile web add /path/to/qqmusic-plugin
```

卸载：

```sh
dsh plugin --profile web remove @local/qqmusic
```

`qqfav/bin/nowplaying` 是 arm64 预编译二进制，Intel Mac 上先跑一次 `./qqfav/build.sh` 重编（需要 Xcode 命令行工具）。

## 快速开始

1. 确认 macOS 版 QQ 音乐客户端已登录（插件默认从这里取登录态）。
2. 刷新 Harness 页面，点侧边栏的音符图标。
3. 点击侧边栏音符、或面板左上角的品牌图标，都会回到主页；账户按钮的绿色圆点表示已登录。
4. 面板默认落在「主页」：每日30首、猜你喜欢、推荐歌单都在同一页，点任意一行即可播放。
5. 搜索 → 点一行播放 → 点该行或播放条上的 ♥ 收藏到本季。

本季歌单名按自然季度计算：`f"{年}Q{季度}"`，1–3 月 Q1、4–6 月 Q2、7–9 月 Q3、10–12 月 Q4。

## 登录态

优先级从高到低：

1. 面板里粘贴的 Cookie（`登录态` 按钮，仅当前 Host 进程内存）
2. 插件配置 `cookie`
3. 环境变量 `QQFAV_COOKIE`
4. `~/.config/qqfav/cookie.txt`、`~/.config/qqmusic/cookie.txt`
5. `~/Library/Preferences/com.tencent.QQMusicMac.plist` 里 `AutoLoginUserInfo` 的 `nUserId` + `strAuthst`（NSKeyedArchiver，插件用 `plutil` 解码）

Cookie 形式：`uin=o0<uin>; qm_keyst=<token>`；`qqmusic_key` / `musickey` 也识别。

## 配置

插件行在 `cordis.patch.yml` 里，可选字段：

```yaml
- id: qqmusic
  name: '@local/qqmusic'
  config:
    cookie: 'uin=o0...; qm_keyst=...'   # 可选，绕过客户端登录态
    playlist: '2026Q4'                  # 可选，覆盖季度歌单名
    nowPlayingBin: '/usr/local/bin/nowplaying'  # 可选，覆盖包内自带的读取器
```

`nowPlayingBin` 不填时会依次找包内自带的 `qqfav/bin/nowplaying`、`~/myprojects/qqfav/bin/nowplaying`、`~/bin/nowplaying`、`/usr/local/bin/nowplaying`、`/opt/homebrew/bin/nowplaying`，也认 `QQFAV_NOWPLAYING`。这个 MediaRemote 读取器随包分发（`qqfav/` 目录），新克隆的仓库装完即可用，不再依赖外部 qqfav 检出。

## 内置的 qqfav

`qqfav/` 是同一份「一键收藏正在播放」命令行工具，与插件共用歌单语义、登录态读取和 `nowplaying` 读取器：

```sh
./qqfav/bin/qqfav check            # 诊断：登录态 / 歌单 / 正在播放
./qqfav/bin/qqfav now --notify     # 收藏当前播放并弹通知
./qqfav/bin/qqfav list             # 看本季歌单
```

`qqfav/bin/nowplaying` 是 arm64 预编译二进制，源码在 `qqfav/src/nowplaying.swift`；需要重编时运行 `./qqfav/build.sh`（需要 Xcode 命令行工具）。更多用法见 [qqfav/README.md](qqfav/README.md)。

## 本季收藏的行为

与 `qqfav` CLI 完全一致的语义：

1. 先列我的歌单，名字精确匹配则复用，否则 `AddPlaylist` 创建并回读 `dirId/tid`。
2. 加歌前用 `CgiGetDiss` 读全量曲目（`song_num: 300` 自动翻页），按数字 `songId` 判重。
3. 已存在 → 直接返回「已在歌单中」，不写入。
4. 写入用 `AddSonglist`，参数是数字 `songId` + `songType`（不是 mid）。
5. 写完再次读回，确认歌曲确实出现，否则报错。

逐级校验外层 `code`、业务块 `req.code` 和 `data.retCode`；`1000/301` 提示登录态失效，`80105` 提示服务端拒绝写入。

## HTTP 接口

面板通过同源 `/qqmusic/api` 调用 Host，其他本机脚本也可以直接用：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/status` | 登录态（脱敏）、本季歌单、系统正在播放 |
| GET | `/home` | 今日推荐：每日30首、推荐歌单、猜你喜欢；`?refresh=1` 强制刷新 |
| GET | `/radio?limit=16&exclude=mid1,mid2` | 猜你喜欢：`id:99` 频道逐批取 5 首去重，`exclude` 用于「换一批」 |
| GET | `/playlists` | 我的歌单 |
| GET | `/playlist?name=2026Q4` 或 `?dirId=&tid=` | 歌单曲目（`dirId+tid` 也支持推荐里的公开歌单） |
| GET | `/search?q=晴天 周杰伦&limit=30` | 搜索 |
| GET | `/songurl?mid=...&quality=high&mediaMid=...` | 播放地址；`quality` 为 `standard/high/lossless`，返回实际音质 `actual` |
| GET | `/audio?mid=...&quality=...&mediaMid=...` | 音频代理，支持 Range |
| GET | `/lyric?mid=...` | LRC 歌词 |
| GET | `/nowplaying` | 系统「正在播放」 |
| POST | `/fav` | `{mid}`、`{text}` 或 `{system:true}`，可带 `playlist` |
| POST | `/login` | `{cookie}` 临时切换登录态 |

只监听本机 Web 服务，并且拒绝非 127.0.0.1/::1 的请求。token 只在本机内存里用于请求头，接口永远不返回它。

## 诊断

Host 半边内置自检，不经过 Web：

```bash
cd ~/myprojects/qqmusic-plugin
node index.js selftest
```

会打印：登录账号（脱敏）、歌单总数、本季歌单与曲目数、搜索首条、播放地址、歌词长度、系统正在播放。

## 交互与设计

按 [apple-design-skill](https://github.com/dickwu/apple-design-skill) 的改进模式重做，参考 macOS HIG 的 layout / typography / color / accessibility / toolbars / search-fields / materials / motion / lists-and-tables：

- **导航**：只保留两个入口——左上角品牌图标（= 主页，点击 Harness 侧栏音符也回主页）和「歌单」；搜索固定在工具栏右侧。
- **推荐缓存**：首页数据（每日30首、猜你喜欢、推荐歌单）按上海日期存本地，进入面板或切回主页不会重新请求；只有「换一批」或工具栏刷新才会更新。
- **布局**：每日推荐和猜你喜欢在宽屏左右两栏、各自独立滚动（≤720px 才堆叠），不再纵向串成两条长列表。
- **播放连续性**：播放器单例挂在 `window.__qqmusicPlayerV1` 上（脱离面板组件的 `<audio>`），切换 Harness 页面、收起面板都不会中断；插件模块热重载时新模块会复用同一个 store 和 audio，不会出现“有声音但底部播放器显示未播放”的脱绑。回到面板会恢复到当前曲目与进度。
- **常驻播放器**：QQ 音乐面板底部固定一条播放器（空闲时也保留），点队列图标在播放器上方展开当前队列，点任意一首直接跳转；切换 Harness 页面时音频继续，回到面板仍在并恢复进度。播放模式是一个按钮，点一下在 顺序 → 列表循环 → 单曲循环 → 随机 之间切换。
- **播放**：底部常驻播放器（实底功能条，不占用内容滚动区）；点封面/标题或右侧展开按钮进入「正在播放」页。玻璃只保留在工具栏这类功能层，内容层保持不透明（materials › Liquid Glass）。
- **类型**：系统字体，macOS 字阶 26 / 22 / 17 / 15 / 13 / 11；正文 13px，元信息不小于 11px（typography › macOS built-in text styles）。
- **控件与可达性**：图标按钮 28×28（高于 macOS 20pt 最小值），列表行 44–46px；图标按钮都有 `aria-label`，导航用 `aria-current` 标记当前位置，弹层可 Escape 关闭，焦点有可见描边。
- **降级**：`prefers-reduced-motion` 关闭动画，`prefers-reduced-transparency` 回退为不透明，颜色全部使用 `--dsw-alias-*` 语义色。
- **反馈**：提示改为可手动关闭的行内条（不再自动消失），加载用骨架行替代文案跳动。

## 实现要点

- 走 QQ 音乐 Web 端内部 RPC `https://u.y.qq.com/cgi-bin/musicu.fcg`，JSON 信封 `{"comm":{...},"req":{module,method,param}}`；鉴权 Cookie `uin=o0<uin>; qm_keyst=<token>`，`g_tk = hash33(token, 5381)`。
- 用到的接口：`PlaylistBaseRead/GetPlaylistByUin`、`PlaylistBaseWrite/AddPlaylist`、`DissInfo/CgiGetDiss`、`PlaylistDetailWrite/AddSonglist`、`SearchCgiService/DoSearchForQQMusicDesktop`、`pf_song_detail_svr/get_song_detail`、`vkey.GetVkeyServer/CgiGetVkey`。
- 今日推荐：`recommend.RecommendFeed/get_recommend_feed` 的 `subtype:510` 卡片给出当日「每日30首」动态歌单 id（校验上海当天），再 `CgiGetDiss` 读 30 首；推荐歌单用 `playlist.PlaylistSquare/GetRecommendFeed`；猜你喜欢用 `radioProxy.MbTrackRadioSvr/get_radio_track`，必须带 `{id:99, num:5, from:0, scene:0, song_ids:[]}`——空参数会落到「睡前」主题电台；每次串行取 5 首新歌（并发只会拿到同一批），独立页取 16 首、主页取 10 首，换一批带上已看过的 mid 做排除。
- 音质用 vkey 的 `filename` 前缀区分：`C400` 128k m4a、`M800` 320k mp3、`A000` FLAC、`F000` Hi-Res FLAC。拿到 purl 后先发 1 字节 Range 请求探测，404 就按 `无损 → Hi-Res → 320k → 128k` 降级，播放条上的小徽标显示真实拿到的音质。
- 音频不走 `<audio>` 直连 CDN，而是经 Host 代理，避免跨域 / Referer 限制，并保留 Range 以便拖动进度。
- 面板是 `main` 槽里的 React 组件，图标注册在 `sidebar.panellist`；样式只用 `--dsw-alias-*` 主题变量。

## 文件

```
qqmusic-plugin/
├── index.js          # Host：登录态、RPC、HTTP、音频代理、季度收藏
├── client.js         # Client：面板 UI、播放器、歌词、歌单
├── cordis.patch.yml  # bundle 行与配置
├── locale/{zh,en}.json
├── icon.svg
└── README.md
```

## 已知限制

- 非官方接口，随时可能变；只做「搜索 / 播放 / 读歌单 / 往自己歌单加歌」，不绕过会员或付费限制。
- 播放地址默认 128kbps m4a；320k / 无损取决于账号权益与音源，插件会自动降级并用播放条上的徽标显示实际音质。
- 无损优先取 `A000` FLAC；QQ 偶尔会返回一个实际 404 的 A000 purl，此时改用 `F000` Hi-Res FLAC，再不行降到 320k。
- 每日30首按上海日期校验，跨日或服务端未刷新时主页会提示并保留推荐歌单 / 猜你喜欢。
- 系统「正在播放」靠 MediaRemote，暂停或客户端未播放时可能读不到——此时用播放条上的 ♥ 直接收藏插件内正在播放的歌，或在面板里搜索后点行内 ♥。
- 修改 Host 代码（`index.js`）后需要重启 Harness 才会加载新代码；Client（`client.js`）在开发模式下由 HMR 重载。

## 许可证

[MIT](LICENSE) © 2026 nopainanymore
