window.__ModuleLoader__.load({
  id: '@local/qqmusic',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'qqmusic.panel'
    const API = '/qqmusic/api'
    const HOME_CACHE_KEY = 'qqm.home.v1'
    const homeListeners = new Set()

    function requestHome() {
      for (const listener of homeListeners) listener()
    }

    /* ------------------------------------------------------------ */
    /* locale                                                        */
    /* ------------------------------------------------------------ */

    const DICTS = {
      en: {
        'panel.label': 'QQ Music',
        'panel.title': 'QQ Music',
        'panel.subtitle': 'Search, stream and favorite with your own QQ Music account.',
        'tab.home': 'Home',
        'tab.radio': 'For You',
        'tab.library': 'Library',
        'action.refresh': 'Refresh',
        'action.playAll': 'Play all',
        'action.fav': 'Favorite to this quarter',
        'action.faved': 'In this quarter',
        'action.favSystem': "Favorite what's playing",
        'action.lyric': 'Lyrics',
        'action.login': 'Account',
        'action.submit': 'Use this cookie',
        'action.retry': 'Try again',
        'action.close': 'Close',
        'action.play': 'Play',
        'action.pause': 'Pause',
        'action.prev': 'Previous',
        'action.next': 'Next',
        'action.back': 'Back',
        'action.open': 'Open',
        'player.expand': 'Open Now Playing',
        'player.idleHint': 'Pick a song from Home or Library',
        'mode.label': 'Play mode',
        'mode.order': 'Play in order',
        'mode.all': 'Repeat all',
        'mode.one': 'Repeat one',
        'mode.shuffle': 'Shuffle',
        'queue.title': 'Play queue',
        'queue.empty': 'The queue is empty',
        'np.title': 'Now Playing',
        'np.close': 'Close Now Playing',
        'np.queue': 'Queue · {count} songs',
        'side.home': 'Home',
        'side.radio': 'For You',
        'side.quarter': 'This quarter',
        'side.playlists': 'My playlists',
        'side.filter': 'Filter playlists',
        'home.date': 'Daily picks · {date}',
        'home.loading': 'Loading today’s picks…',
        'home.error': 'Could not load today’s picks',
        'home.daily': 'Daily 30',
        'home.playlists': 'Made for you',
        'home.radio': 'Guess you like',
        'home.unavailable': 'Today’s Daily 30 is not ready yet',
        'home.viewAll': 'See all',
        'home.refresh': 'Refresh picks',
        'radio.refresh': 'Shuffle',
        'radio.empty': 'No more picks right now — try again later',
        'radio.loading': 'Picking songs for you…',
        'player.seek': 'Playback position',
        'player.volume': 'Volume',
        'library.title': 'Library',
        'library.quarter': 'This quarter',
        'library.playlists': 'My playlists',
        'library.filter': 'Filter playlists',
        'library.empty': 'No playlists yet',
        'quarter.hint': 'Created automatically · duplicates skipped',
        'quality.label': 'Quality',
        'quality.standard': 'Standard',
        'quality.high': 'High',
        'quality.lossless': 'Lossless',
        'search.placeholder': 'Search songs, artists, albums…',
        'search.button': 'Search',
        'search.searching': 'Searching…',
        'search.empty': 'Search something to start listening',
        'search.noresult': 'No songs found',
        'search.title': 'Results for “{q}”',
        'search.clear': 'Clear search',
        'status.login': 'Signed in {uin}',
        'status.playlist': 'Quarter playlist {name}',
        'status.songs': '{count} songs',
        'source.client': 'QQ Music client',
        'source.config': 'plugin config',
        'source.panel': 'cookie',
        'source.file': 'cookie file',
        'source.env': 'environment',
        'player.idle': 'Nothing playing yet',
        'player.queue': 'Queue · {count} songs',
        'fav.success': 'Added to “{name}” · {count} songs',
        'fav.duplicate': 'Already in “{name}” · {count} songs',
        'fav.working': 'Saving…',
        'error.login': 'No QQ Music login state',
        'error.loginHint': 'Sign in to the macOS QQ Music app, or paste a cookie below.',
        'error.load': 'Could not load',
        'error.play': 'Could not play “{title}”',
        'empty.search': 'Type a keyword and press Enter. Click a row to play, click the heart to favorite.',
        'empty.playlist': 'This playlist is empty',
        'empty.quarter': 'Nothing collected this quarter yet. Hit the heart while playing.',
        'lyric.title': 'Lyrics',
        'lyric.empty': 'No lyrics for this song',
        'lyric.loading': 'Loading lyrics…',
        'quarter.missing': 'This quarter has no playlist yet — favorite one song and it will be created.',
        'login.title': 'Login state',
        'login.account': 'Account',
        'login.hint': 'Read from the local QQ Music client by default. A cookie lives only in this Host process memory.',
        'login.placeholder': 'uin=o0...; qm_keyst=...',
        'login.saved': 'Switched to the pasted cookie',
        'login.invalid': 'Cookie did not work',
        'unit.songs': 'songs',
        'unit.playlists': '{count} playlists',
        'notice.close': 'Dismiss',
      },
      zh: {
        'panel.label': 'QQ 音乐',
        'panel.title': 'QQ 音乐',
        'panel.subtitle': '用你自己的 QQ 音乐账号搜索、播放、收藏。',
        'tab.home': '主页',
        'tab.radio': '猜你喜欢',
        'tab.library': '歌单',
        'action.refresh': '刷新',
        'action.playAll': '播放全部',
        'action.fav': '收藏到本季',
        'action.faved': '已在本季歌单',
        'action.favSystem': '收藏系统正在播放',
        'action.lyric': '歌词',
        'action.login': '登录态',
        'action.submit': '使用这个 Cookie',
        'action.retry': '重试',
        'action.close': '关闭',
        'action.play': '播放',
        'action.pause': '暂停',
        'action.prev': '上一首',
        'action.next': '下一首',
        'action.back': '返回',
        'action.open': '打开',
        'player.expand': '展开播放页',
        'player.idleHint': '从主页或歌单里选一首',
        'mode.label': '播放模式',
        'mode.order': '顺序播放',
        'mode.all': '列表循环',
        'mode.one': '单曲循环',
        'mode.shuffle': '随机播放',
        'queue.title': '播放队列',
        'queue.empty': '队列是空的',
        'np.title': '正在播放',
        'np.close': '收起播放页',
        'np.queue': '队列 · {count} 首',
        'side.home': '主页',
        'side.radio': '猜你喜欢',
        'side.quarter': '本季收藏',
        'side.playlists': '我的歌单',
        'side.filter': '筛选歌单',
        'home.date': '每日推荐 · {date}',
        'home.loading': '正在加载今日推荐…',
        'home.error': '今日推荐加载失败',
        'home.daily': '每日30首',
        'home.playlists': '推荐歌单',
        'home.radio': '猜你喜欢',
        'home.unavailable': '今天的每日30首还没有更新',
        'home.viewAll': '查看全部',
        'home.refresh': '刷新推荐',
        'radio.refresh': '换一批',
        'radio.empty': '这一批没有更多了，稍后再试',
        'radio.loading': '正在为你挑选…',
        'player.seek': '播放进度',
        'player.volume': '音量',
        'library.title': '歌单',
        'library.quarter': '本季收藏',
        'library.playlists': '我的歌单',
        'library.filter': '筛选歌单',
        'library.empty': '还没有歌单',
        'quarter.hint': '自动创建 · 重复收藏跳过',
        'quality.label': '音质',
        'quality.standard': '标准',
        'quality.high': '高品质',
        'quality.lossless': '无损',
        'search.placeholder': '搜索歌曲、歌手、专辑…',
        'search.button': '搜索',
        'search.searching': '搜索中…',
        'search.empty': '搜点什么，开始听歌',
        'search.noresult': '没有找到相关歌曲',
        'search.title': '搜索「{q}」',
        'search.clear': '清除搜索',
        'status.login': '已登录 {uin}',
        'status.playlist': '本季歌单 {name}',
        'status.songs': '{count} 首',
        'source.client': 'QQ 音乐客户端',
        'source.config': '插件配置',
        'source.panel': '手动 Cookie',
        'source.file': 'Cookie 文件',
        'source.env': '环境变量',
        'player.idle': '还没有播放歌曲',
        'player.queue': '队列 · {count} 首',
        'fav.success': '已收藏到「{name}」，共 {count} 首',
        'fav.duplicate': '「{name}」里已有这首歌，共 {count} 首',
        'fav.working': '写入中…',
        'error.login': '没有读到 QQ 音乐登录态',
        'error.loginHint': '先登录 macOS 版 QQ 音乐客户端，或在下面粘贴 Cookie。',
        'error.load': '加载失败',
        'error.play': '播放「{title}」失败',
        'empty.search': '输入关键词回车搜索。点一行播放，点心收藏。',
        'empty.playlist': '这个歌单还是空的',
        'empty.quarter': '本季还没有收藏。播放时点 ♥ 就能收进来。',
        'lyric.title': '歌词',
        'lyric.empty': '这首歌没有歌词',
        'lyric.loading': '歌词加载中…',
        'quarter.missing': '本季歌单还不存在，收藏一首就会自动创建。',
        'login.title': '登录态',
        'login.account': '账户',
        'login.hint': '默认直接读取本机 QQ 音乐客户端登录信息；手动 Cookie 只保存在 Host 进程内存里。',
        'login.placeholder': 'uin=o0...; qm_keyst=...',
        'login.saved': '已切换到手动 Cookie',
        'login.invalid': 'Cookie 验证失败',
        'unit.songs': '首',
        'unit.playlists': '{count} 个歌单',
        'notice.close': '关闭提示',
      },
    }

    let translate = (key, vars) => {
      const template = DICTS.zh[key] === undefined ? key : DICTS.zh[key]
      return vars
        ? template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] === undefined ? '' : String(vars[name])))
        : template
    }

    function bindLocale(ctx) {
      try {
        const dispose = ctx.locale.register(NS, DICTS)
        const bound = ctx.locale.bind(NS)
        translate = (key, vars) => {
          let text
          try {
            text = bound(key, vars)
          } catch {
            text = undefined
          }
          if (typeof text !== 'string' || text === key) {
            const template = DICTS.zh[key] === undefined ? key : DICTS.zh[key]
            text = vars
              ? template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] === undefined ? '' : String(vars[name])))
              : template
          }
          return text
        }
        return dispose
      } catch (error) {
        console.warn('[qqmusic] locale registration failed', error)
        return () => {}
      }
    }

    const t = (key, vars) => translate(key, vars)

    /* ------------------------------------------------------------ */
    /* host bridge                                                   */
    /* ------------------------------------------------------------ */

    async function payloadOf(response) {
      const text = await response.text()
      let payload
      try {
        payload = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(text.slice(0, 200) || response.statusText)
      }
      if (!response.ok) {
        const error = new Error(payload.error || response.statusText)
        error.login = Boolean(payload.login)
        error.status = response.status
        throw error
      }
      return payload
    }

    function apiGet(path) {
      return fetch(API + path, { headers: { accept: 'application/json' } }).then(payloadOf)
    }

    function apiPost(path, body) {
      return fetch(API + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body || {}),
      }).then(payloadOf)
    }

    /* ------------------------------------------------------------ */
    /* helpers                                                       */
    /* ------------------------------------------------------------ */

    function shanghaiDay() {
      return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
    }

    function readHomeCache() {
      try {
        const raw = window.localStorage.getItem(HOME_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || parsed.day !== shanghaiDay() || !parsed.data) return null
        return parsed
      } catch {
        return null
      }
    }

    function writeHomeCache(data, seen) {
      try {
        window.localStorage.setItem(
          HOME_CACHE_KEY,
          JSON.stringify({ day: shanghaiDay(), data, seen: Array.from(seen || []) }),
        )
      } catch {
        // storage unavailable or full: the in-memory copy still works
      }
    }

    function fmtTime(value) {
      const seconds = Number(value)
      if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
      const total = Math.floor(seconds)
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
    }

    function coverUrl(track, size) {
      if (!track || !track.albumMid) return ''
      return `https://y.gtimg.cn/music/photo_new/T002R${size}x${size}M000${track.albumMid}.jpg`
    }

    function decodeHtml(text) {
      return String(text)
        .replace(/&#(\d+);/g, (whole, code) => (Number.isFinite(Number(code)) ? String.fromCodePoint(Number(code)) : whole))
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    }

    function parseLrc(text) {
      const lines = []
      for (const raw of String(text || '').split('\n')) {
        const match = raw.match(/^\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\](.*)$/)
        if (!match) continue
        const fraction = (match[3] || '0').padEnd(3, '0').slice(0, 3)
        const seconds = Number(match[1]) * 60 + Number(match[2]) + Number(fraction) / 1000
        const content = decodeHtml(match[4]).trim()
        if (content) lines.push({ t: seconds, text: content })
      }
      lines.sort((left, right) => left.t - right.t)
      return lines
    }

    /* ------------------------------------------------------------ */
    /* playback store + detached audio (survives panel unmount)      */
    /* ------------------------------------------------------------ */

    function storedNumber(key, fallback, min, max) {
      try {
        const value = Number(window.localStorage.getItem(key))
        if (Number.isFinite(value) && value >= min && value <= max) return value
      } catch {
        // ignore
      }
      return fallback
    }

    function storedQuality() {
      try {
        const value = window.localStorage.getItem('qqm.quality')
        if (value === 'standard' || value === 'high' || value === 'lossless') return value
      } catch {
        // ignore
      }
      return 'high'
    }

    const PLAYER_KEY = '__qqmusicPlayerV1'

    function createPlayerStore() {
      return {
        state: {
          queue: [],
          index: -1,
          playing: false,
          time: 0,
          duration: 0,
          mode: 'order',
          quality: storedQuality(),
          volume: storedNumber('qqm.volume', 0.8, 0.01, 1),
        },
        listeners: new Set(),
        set(patch) {
          this.state = { ...this.state, ...patch }
          for (const listener of this.listeners) listener()
        },
        subscribe(listener) {
          this.listeners.add(listener)
          return () => this.listeners.delete(listener)
        },
      }
    }

    // The client module can be reloaded (HMR) while a detached <audio> keeps
    // playing. Keep the store and the audio on window so a reloaded module
    // binds to the same playback instead of starting an empty one.
    function getPlayer() {
      if (window[PLAYER_KEY]) return window[PLAYER_KEY]
      const player = {
        store: createPlayerStore(),
        audio: null,
        lastRetryMid: '',
        notice: null,
      }
      window[PLAYER_KEY] = player
      return player
    }

    const player = getPlayer()
    const playerStore = player.store

    function currentTrack() {
      const { queue, index } = playerStore.state
      return index >= 0 && queue[index] ? queue[index] : null
    }

    function ensurePlayerAudio() {
      if (player.audio) return player.audio
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.volume = playerStore.state.volume
      audio.addEventListener('timeupdate', () => playerStore.set({ time: audio.currentTime || 0 }))
      audio.addEventListener('durationchange', () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) playerStore.set({ duration: audio.duration })
      })
      audio.addEventListener('play', () => playerStore.set({ playing: true }))
      audio.addEventListener('pause', () => playerStore.set({ playing: false }))
      audio.addEventListener('ended', () => {
        const { mode, queue, index } = playerStore.state
        if (mode === 'one') {
          audio.currentTime = 0
          audio.play().catch(() => {})
          return
        }
        if (mode === 'order' && index >= queue.length - 1) {
          playerStore.set({ playing: false })
          return
        }
        playerStep(1)
      })
      audio.addEventListener('error', () => {
        const track = currentTrack()
        if (!track) return
        if (player.lastRetryMid === track.mid) {
          playerStore.set({ playing: false })
          if (player.notice) player.notice(t('error.play', { title: track.title }))
          return
        }
        player.lastRetryMid = track.mid
        const params = new URLSearchParams({
          mid: track.mid,
          quality: playerStore.state.quality,
          r: String(Date.now()),
        })
        if (track.mediaMid) params.set('mediaMid', track.mediaMid)
        audio.src = `${API}/audio?${params.toString()}`
        audio.play().catch(() => {})
      })
      player.audio = audio
      return audio
    }

    function loadPlayerTrack(play, resumeAt) {
      const audio = ensurePlayerAudio()
      const track = currentTrack()
      if (!track) {
        audio.pause()
        return
      }
      const params = new URLSearchParams({ mid: track.mid, quality: playerStore.state.quality, t: String(Date.now()) })
      if (track.mediaMid) params.set('mediaMid', track.mediaMid)
      player.lastRetryMid = ''
      audio.src = `${API}/audio?${params.toString()}`
      audio.load()
      if (resumeAt > 0) {
        const restore = () => {
          try {
            audio.currentTime = Math.min(
              resumeAt,
              Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : resumeAt,
            )
          } catch {
            // ignore seek failure
          }
          if (play) audio.play().catch(() => {})
        }
        audio.addEventListener('loadedmetadata', restore, { once: true })
      } else if (play) {
        audio.play().catch(() => {})
      }
    }

    function playerPlayList(list, start) {
      if (!list || list.length === 0) return
      const position = start || 0
      playerStore.set({
        queue: list.slice(),
        index: position,
        time: 0,
        duration: Number(list[position].interval) || 0,
      })
      loadPlayerTrack(true, 0)
    }

    function playerStep(delta) {
      const { queue, index, mode } = playerStore.state
      if (queue.length === 0) return
      let next = (index + delta + queue.length) % queue.length
      if (mode === 'shuffle' && queue.length > 1) {
        do {
          next = Math.floor(Math.random() * queue.length)
        } while (next === index)
      }
      playerStore.set({ index: next, time: 0, duration: Number(queue[next].interval) || 0 })
      loadPlayerTrack(true, 0)
    }

    function playerJumpTo(position) {
      const { queue } = playerStore.state
      if (position < 0 || position >= queue.length) return
      playerStore.set({ index: position, time: 0, duration: Number(queue[position].interval) || 0 })
      loadPlayerTrack(true, 0)
    }


    function playerToggle() {
      const audio = ensurePlayerAudio()
      if (!currentTrack()) return
      if (audio.paused) audio.play().catch(() => {})
      else audio.pause()
    }

    function playerSeek(seconds) {
      const audio = ensurePlayerAudio()
      audio.currentTime = seconds
      playerStore.set({ time: seconds })
    }

    const PLAY_MODES = ['order', 'all', 'one', 'shuffle']

    function playerCycleMode() {
      const current = playerStore.state.mode
      const next = PLAY_MODES[(PLAY_MODES.indexOf(current) + 1) % PLAY_MODES.length]
      playerStore.set({ mode: next })
    }

    function playerChangeQuality(next) {
      if (next === playerStore.state.quality) return
      const audio = ensurePlayerAudio()
      const at = audio.currentTime || 0
      const wasPlaying = !audio.paused
      playerStore.set({ quality: next })
      try {
        window.localStorage.setItem('qqm.quality', next)
      } catch {
        // ignore
      }
      if (currentTrack()) loadPlayerTrack(wasPlaying, at)
    }

    function playerSetVolume(value) {
      playerStore.set({ volume: value })
      ensurePlayerAudio().volume = value
      try {
        window.localStorage.setItem('qqm.volume', String(value))
      } catch {
        // ignore
      }
    }

    /* ------------------------------------------------------------ */
    /* icons                                                         */
    /* ------------------------------------------------------------ */

    function Svg(props) {
      const size = props.size || 16
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: props.viewBox || '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block', flex: 'none' },
        },
        props.children,
      )
    }

    function PlayIcon(props) {
      return h(Svg, { size: props.size || 18 }, h('path', { d: 'M8 5.3a1 1 0 0 1 1.53-.85l9.5 6.2a1 1 0 0 1 0 1.7l-9.5 6.2A1 1 0 0 1 8 17.7z', fill: 'currentColor' }))
    }

    function PauseIcon(props) {
      return h(
        Svg,
        { size: props.size || 18 },
        h('rect', { x: 6.5, y: 5, width: 3.6, height: 14, rx: 1.2, fill: 'currentColor' }),
        h('rect', { x: 13.9, y: 5, width: 3.6, height: 14, rx: 1.2, fill: 'currentColor' }),
      )
    }

    function PrevIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M7 5.5v13', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
        h('path', { d: 'M18 6.3v11.4a.9.9 0 0 1-1.4.75l-8-5.7a.9.9 0 0 1 0-1.5l8-5.7A.9.9 0 0 1 18 6.3z', fill: 'currentColor' }),
      )
    }

    function NextIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M17 5.5v13', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
        h('path', { d: 'M6 6.3v11.4a.9.9 0 0 0 1.4.75l8-5.7a.9.9 0 0 0 0-1.5l-8-5.7A.9.9 0 0 0 6 6.3z', fill: 'currentColor' }),
      )
    }

    function HeartIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', {
          d: 'M12 20.1 5 13.2a4.6 4.6 0 0 1 0-6.6 4.6 4.6 0 0 1 6.6 0l.4.4.4-.4a4.6 4.6 0 0 1 6.6 6.6z',
          fill: props.filled ? 'currentColor' : 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinejoin: 'round',
        }),
      )
    }

    function RepeatIcon(props) {
      return h(
        Svg,
        { size: props.size || 15 },
        h('path', { d: 'M17 4.5l2.8 2.8L17 10', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M19.4 7.3H8.2A4.2 4.2 0 0 0 4 11.5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('path', { d: 'M7 19.5 4.2 16.7 7 13.9', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M4.6 16.7h11.2a4.2 4.2 0 0 0 4.2-4.2', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
        props.one ? h('circle', { cx: 12, cy: 12, r: 1.6, fill: 'currentColor' }) : null,
      )
    }

    function VolumeIcon(props) {
      return h(
        Svg,
        { size: props.size || 14 },
        h('path', { d: 'M4 9.5h3.2L12 6v12l-4.8-3.5H4z', fill: 'currentColor' }),
        h('path', { d: 'M15 9.2a4 4 0 0 1 0 5.6M17.6 6.6a7.6 7.6 0 0 1 0 10.8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
      )
    }

    function SearchIcon(props) {
      return h(
        Svg,
        { size: props.size || 15 },
        h('circle', { cx: 10.5, cy: 10.5, r: 5.8, stroke: 'currentColor', strokeWidth: 1.7 }),
        h('path', { d: 'M15 15l4.2 4.2', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
      )
    }

    function RefreshIcon(props) {
      return h(
        Svg,
        { size: props.size || 14 },
        h('path', { d: 'M19 5.5V10h-4.5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M18.6 10a7 7 0 1 0 .3 4', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
      )
    }

    function MusicIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', {
          d: 'M15.5 4.2v10.3a3.4 3.4 0 1 1-1.7-2.95V7.8l-5.4 1.2v6.5a3.4 3.4 0 1 1-1.7-2.95V6.6c0-.7.48-1.3 1.16-1.44l6.4-1.4c.78-.17 1.24.3 1.24 1.04z',
          fill: 'currentColor',
        }),
      )
    }

    function HomeIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', {
          d: 'M4 10.6 12 4l8 6.6V19a1.4 1.4 0 0 1-1.4 1.4h-4.4V14H9.8v6.4H5.4A1.4 1.4 0 0 1 4 19z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinejoin: 'round',
        }),
      )
    }

    function SparkleIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', {
          d: 'M11.5 3.2 13.4 8l4.8 1.9-4.8 1.9-1.9 4.8-1.9-4.8L4.8 9.9 9.6 8z',
          fill: 'currentColor',
        }),
        h('path', {
          d: 'M18.4 14.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z',
          fill: 'currentColor',
          opacity: 0.65,
        }),
      )
    }

    function LyricsIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M4 6.5h9M4 11h13M4 15.5h7M4 20h11', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
      )
    }

    function OrderIcon(props) {
      return h(
        Svg,
        { size: props.size || 15 },
        h('path', { d: 'M4 7h8.5M4 12h8.5M4 17h5.5', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
        h('path', {
          d: 'M14.5 9.5 17 12l-2.5 2.5M17 12h-3.5',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
        }),
      )
    }

    function ShuffleIcon(props) {
      return h(
        Svg,
        { size: props.size || 15 },
        h('path', {
          d: 'M4 7h2.4c1.5 0 2.9.7 3.7 2l3.8 5.2c.8 1.3 2.2 2 3.7 2H20',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
        }),
        h('path', { d: 'M17.4 4.6 20 7.2l-2.6 2.6', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
        h('path', {
          d: 'M4 17h2.4c1.5 0 2.9-.7 3.7-2l1-1.4',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
        }),
        h('path', { d: 'M17.4 14.4 20 17l-2.6 2.6', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
      )
    }

    function ModeIcon(props) {
      const size = props.size || 15
      if (props.mode === 'shuffle') return h(ShuffleIcon, { size })
      if (props.mode === 'one') return h(RepeatIcon, { size, one: true })
      if (props.mode === 'all') return h(RepeatIcon, { size })
      return h(OrderIcon, { size })
    }

    function QueueIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M4 6.5h16M4 12h16M4 17.5h9', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
      )
    }

    function ChevronUpIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M6 14.5l6-6 6 6', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
      )
    }

    function ChevronDownIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M6 9.5l6 6 6-6', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      )
    }

    function ChevronLeftIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M15 5.5 8.5 12l6.5 6.5', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      )
    }

    function ChevronRightIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('path', { d: 'M9 5.5 15.5 12 9 18.5', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      )
    }

    function UserIcon(props) {
      return h(
        Svg,
        { size: props.size || 16 },
        h('circle', { cx: 12, cy: 8.5, r: 3.4, stroke: 'currentColor', strokeWidth: 1.7 }),
        h('path', { d: 'M5.5 19.5c.8-3.1 3.3-4.8 6.5-4.8s5.7 1.7 6.5 4.8', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
      )
    }

    function XIcon(props) {
      return h(
        Svg,
        { size: props.size || 14 },
        h('path', { d: 'M6 6l12 12M18 6L6 18', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
      )
    }

    function Cover(props) {
      const [failed, setFailed] = React.useState(false)
      const size = props.size || 44
      const radius = props.radius == null ? 8 : props.radius
      const className = props.className || 'qm-row-art'
      const box = props.fill
        ? { borderRadius: radius }
        : { width: size, height: size, borderRadius: radius }
      const url = props.track && !failed ? coverUrl(props.track, size >= 160 ? 500 : 300) : ''
      if (!url) {
        return h(
          'div',
          { className: `${className} qm-cover-fallback`, style: box },
          h(MusicIcon, { size: Math.max(14, Math.round(size * 0.4)) }),
        )
      }
      return h('img', {
        className,
        src: url,
        alt: '',
        loading: 'lazy',
        style: { ...box, objectFit: 'cover' },
        onError: () => setFailed(true),
      })
    }

    /* ------------------------------------------------------------ */
    /* styles                                                        */
    /* ------------------------------------------------------------ */

    const CSS = `
.qm-root{--qm-ease:cubic-bezier(.22,.8,.25,1);height:100%;min-height:0;display:flex;flex-direction:column;position:relative;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Helvetica Neue",Arial,sans-serif;font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased}
.qm-toolbar{position:relative;z-index:10;display:flex;align-items:center;gap:14px;padding:9px 18px;flex:none;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);background:color-mix(in srgb,var(--dsw-alias-bg-base) 78%,transparent);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4)}
.qm-nav{appearance:none;display:flex;align-items:center;gap:7px;height:30px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
.qm-nav:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.qm-nav[aria-current="page"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.qm-navbar{display:flex;align-items:center;gap:2px}
.qm-brand{flex:none;font-size:13px;font-weight:600;letter-spacing:-.01em}
.qm-logo{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;color:#fff;background:linear-gradient(140deg,#3ad98f,#1fae6c)}
.qm-toolbar-right{margin-left:auto;display:flex;align-items:center;gap:6px;min-width:0}
.qm-search{display:flex;align-items:center;gap:6px;width:220px;height:28px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);transition:border-color .15s,box-shadow .15s}
.qm-search:focus-within{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.qm-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px}
.qm-search input::placeholder{color:var(--dsw-alias-label-secondary)}
.qm-iconbtn{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);width:28px;height:28px;border-radius:7px;display:grid;place-items:center;cursor:pointer;flex:none;transition:background .12s,color .12s}
.qm-iconbtn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.qm-iconbtn:active:not(:disabled){transform:scale(.94)}
.qm-iconbtn:disabled{opacity:.35;cursor:default}
.qm-iconbtn.on{color:var(--dsw-alias-brand-primary)}
.qm-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,transform .12s}
.qm-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.qm-btn:active:not(:disabled){transform:scale(.98)}
.qm-btn:disabled{opacity:.45;cursor:default}
.qm-btn.primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.qm-btn.primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);filter:brightness(1.05)}
.qm-btn.ghost{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary)}
.qm-btn.ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.qm-content{flex:1;min-height:0;overflow:auto;padding:26px 28px 40px;outline:0;overscroll-behavior:contain}
.qm-page{max-width:1080px;margin:0 auto}
.qm-eyebrow{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-brand-primary);font-weight:600}
.qm-hero{display:grid;grid-template-columns:176px minmax(0,1fr);gap:24px;align-items:end;padding-bottom:8px}
.qm-hero-art{width:176px;height:176px;border-radius:16px;object-fit:cover;box-shadow:0 18px 46px rgba(0,0,0,.18);background:var(--dsw-alias-bg-layer-2)}
.qm-hero-body{min-width:0;padding-bottom:4px}
.qm-hero-title{margin:6px 0 8px;font-size:26px;line-height:1.12;font-weight:700;letter-spacing:-.02em}
.qm-hero-desc{margin:0;max-width:56ch;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.qm-hero-actions{display:flex;align-items:center;gap:8px;margin-top:16px;flex-wrap:wrap}
.qm-section{margin-top:32px}
.qm-home-columns{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(0,1fr);gap:18px;margin-top:24px;align-items:stretch}
.qm-home-columns.single{grid-template-columns:1fr}
.qm-home-columns .qm-section{margin-top:0;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;display:flex;flex-direction:column;min-height:0}
.qm-home-columns .qm-section-head{margin:0;padding:12px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.qm-home-columns .qm-section > .qm-rows{max-height:min(54vh,520px);overflow:auto;padding:6px;overscroll-behavior:contain}
.qm-section-head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}
.qm-section-title{font-size:17px;font-weight:600;letter-spacing:-.01em}
.qm-section-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}
.qm-section-actions{margin-left:auto;display:flex;align-items:center;gap:6px}
.qm-shelf{display:grid;grid-auto-flow:column;grid-auto-columns:146px;gap:14px;overflow-x:auto;padding:2px 2px 12px;scroll-snap-type:x proximity}
.qm-card{appearance:none;border:0;background:transparent;padding:0;text-align:left;color:inherit;font:inherit;cursor:pointer;scroll-snap-align:start;min-width:0}
.qm-card-art{width:146px;height:146px;border-radius:12px;object-fit:cover;display:block;background:var(--dsw-alias-bg-layer-2);transition:transform .18s var(--qm-ease),box-shadow .18s}
.qm-card:hover .qm-card-art{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.16)}
.qm-card:active .qm-card-art{transform:translateY(0) scale(.99)}
.qm-card-name{margin-top:8px;font-size:12.5px;font-weight:550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-card-meta{margin-top:1px;font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-rows{display:flex;flex-direction:column;gap:1px}
.qm-row{display:flex;align-items:center;gap:4px;min-height:46px;padding:0 4px 0 0;border-radius:10px;transition:background .12s}
.qm-row:hover{background:var(--dsw-alias-bg-layer-2)}
.qm-row.active{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,transparent)}
.qm-row-hit{appearance:none;display:flex;align-items:center;gap:11px;flex:1;min-width:0;min-height:44px;padding:5px 8px;border:0;border-radius:10px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.qm-row-art{width:36px;height:36px;border-radius:6px;flex:none;object-fit:cover;background:var(--dsw-alias-bg-layer-2);display:block}
.qm-cover-fallback{display:grid;place-items:center;flex:none;color:#fff;background:linear-gradient(140deg,#3ad98f,#1fae6c)}
.qm-row-main{flex:1;min-width:0}
.qm-row-title{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-row.active .qm-row-title{color:var(--dsw-alias-brand-primary);font-weight:550}
.qm-row-sub{font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-row-meta{flex:none;width:42px;text-align:right;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.qm-heart{width:28px;height:28px;flex:none}
.qm-heart.on{color:var(--dsw-alias-brand-primary)}
.qm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px}
.qm-grid .qm-card-art{width:100%;height:auto;aspect-ratio:1/1}
.qm-quarter{display:flex;align-items:center;gap:14px;width:100%;padding:14px 16px;margin:2px 0 22px;border-radius:14px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,var(--dsw-alias-border-l1));background:var(--dsw-alias-bg-layer-1);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,var(--dsw-alias-bg-layer-1));color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background .15s}
.qm-quarter:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 11%,var(--dsw-alias-bg-layer-1))}
.qm-quarter-icon{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:var(--dsw-alias-brand-primary);color:#fff;flex:none}
.qm-quarter-text{min-width:0;flex:1}
.qm-quarter-title{font-size:14px;font-weight:600}
.qm-quarter-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:1px}
.qm-page-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.qm-page-title{font-size:22px;font-weight:700;letter-spacing:-.02em}
.qm-page-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}
.qm-page-actions{margin-left:auto;display:flex;align-items:center;gap:8px}
.qm-detail{display:flex;align-items:flex-end;gap:20px;margin-bottom:22px}
.qm-detail-art{width:150px;height:150px;border-radius:14px;object-fit:cover;box-shadow:0 14px 36px rgba(0,0,0,.16);background:var(--dsw-alias-bg-layer-2)}
.qm-detail-body{min-width:0;flex:1}
.qm-detail-title{font-size:24px;font-weight:700;letter-spacing:-.02em;margin:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-detail-sub{font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.qm-filter{height:30px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;width:200px}
.qm-filter:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.qm-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:64px 24px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px}
.qm-empty-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}
.qm-skeleton{height:46px;border-radius:10px;background:linear-gradient(90deg,var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2));background-size:200% 100%;animation:qm-shimmer 1.3s linear infinite;margin-bottom:2px}
.qm-toast{display:flex;align-items:flex-start;gap:10px;max-width:1080px;margin:0 auto 14px;padding:9px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-size:12.5px}
.qm-toast.ok{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 55%,var(--dsw-alias-border-l1));color:var(--dsw-alias-state-success-primary)}
.qm-toast.error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 55%,var(--dsw-alias-border-l1));color:var(--dsw-alias-state-error-primary)}
.qm-toast-text{flex:1;min-width:0}
.qm-player{display:flex;align-items:center;gap:16px;padding:9px 18px;flex:none;min-height:74px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);position:relative;z-index:20}
.qm-player-left{display:flex;align-items:center;gap:6px;width:252px;flex:none;min-width:0}
.qm-player-info{display:flex;align-items:center;gap:10px;flex:1;min-width:0;min-height:44px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;padding:0 4px 0 0;cursor:pointer}
.qm-player-info:disabled{cursor:default}
.qm-player-info:hover:not(:disabled) .qm-player-title{text-decoration:underline;text-underline-offset:2px}
.qm-player-art{width:44px;height:44px;border-radius:8px;object-fit:cover;background:var(--dsw-alias-bg-layer-2);flex:none;display:block}
.qm-player-text{min-width:0;flex:1}
.qm-player-title{font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-player-sub{font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-player-center{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px}
.qm-player-buttons{display:flex;align-items:center;gap:2px}
.qm-player-play{width:32px;height:32px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:#fff}
.qm-player-play:hover:not(:disabled){background:var(--dsw-alias-brand-primary);filter:brightness(1.05);color:#fff}
.qm-player-progress{display:flex;align-items:center;gap:8px;width:100%;max-width:560px;padding:0 4px}
.qm-player-right{display:flex;align-items:center;gap:4px;flex:none;justify-content:flex-end}
.qm-queue{position:absolute;right:16px;bottom:88px;z-index:30;width:min(380px,calc(100% - 32px));max-height:min(52vh,430px);display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-overlay);box-shadow:0 22px 60px rgba(0,0,0,.28);overflow:hidden}
.qm-queue-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.qm-queue-head > span:first-child{font-size:12px;font-weight:600}
.qm-queue-count{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary)}
.qm-queue-list{overflow:auto;padding:4px;overscroll-behavior:contain}
.qm-queue-item{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;padding:6px 8px;border-radius:8px;cursor:pointer;min-height:36px}
.qm-queue-item:hover{background:var(--dsw-alias-bg-layer-2)}
.qm-queue-item.active{color:var(--dsw-alias-brand-primary);font-weight:600}
.qm-queue-index{width:20px;flex:none;text-align:right;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.qm-queue-main{flex:1;min-width:0;display:flex;flex-direction:column}
.qm-queue-title{font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-queue-artist{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-queue-time{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.qm-progress{display:flex;align-items:center;gap:9px}
.qm-range{flex:1;min-width:40px;height:4px;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.qm-time{width:36px;text-align:center;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:none}
.qm-quality{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:11.5px}
.qm-quality select{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:7px;padding:3px 6px;font:inherit;font-size:11.5px;cursor:pointer}
.qm-qbadge{font-size:10.5px;padding:1px 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);min-width:34px;text-align:center}
.qm-volume{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);width:92px;flex:none}
.qm-volume .qm-range{width:64px;flex:none}
.qm-np:focus{outline:0}
.qm-np{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);animation:qm-rise .24s var(--qm-ease)}
.qm-np-bg{position:absolute;inset:-12%;width:124%;height:124%;object-fit:cover;filter:blur(64px) saturate(1.25);opacity:.16;transform:scale(1.05);pointer-events:none}
.qm-np-scrim{position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-base) 35%,transparent),var(--dsw-alias-bg-base) 72%);pointer-events:none}
.qm-np-head{position:relative;display:flex;align-items:center;gap:10px;padding:12px 16px;flex:none}
.qm-np-label{font-size:12px;font-weight:600;letter-spacing:.02em}
.qm-np-head-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.qm-np-body{position:relative;flex:1;min-height:0;overscroll-behavior:contain;display:grid;grid-template-columns:minmax(220px,42%) minmax(0,1fr);gap:36px;padding:6px 40px 24px;align-items:center}
.qm-np-left{display:flex;justify-content:flex-end}
.qm-np-art{width:min(340px,100%);aspect-ratio:1/1;border-radius:20px;object-fit:cover;box-shadow:0 30px 80px rgba(0,0,0,.32);background:var(--dsw-alias-bg-layer-2)}
.qm-np-right{min-width:0;display:flex;flex-direction:column;max-height:560px;height:100%;justify-content:center}
.qm-np-title{font-size:24px;font-weight:700;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qm-np-artist{font-size:15px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.qm-np-album{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:1px;opacity:.85}
.qm-np-lyrics{flex:1;min-height:120px;overflow:auto;margin:18px 0 14px;padding-right:6px;mask-image:linear-gradient(180deg,transparent,#000 12%,#000 88%,transparent);-webkit-mask-image:linear-gradient(180deg,transparent,#000 12%,#000 88%,transparent)}
.qm-np-line{display:block;width:100%;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:15px;line-height:2.05;text-align:center;padding:2px 0;border-radius:6px;cursor:pointer;transition:color .18s,opacity .18s}
.qm-np-line:hover{color:var(--dsw-alias-label-primary)}
.qm-np-line.active{color:var(--dsw-alias-label-primary);font-weight:600;font-size:18px;letter-spacing:.01em}
.qm-np-line:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.qm-np-empty{color:var(--dsw-alias-label-secondary);font-size:12.5px;padding:10px 0}
.qm-np-controls{display:flex;align-items:center;gap:8px;margin-top:12px}
.qm-np-play{width:44px;height:44px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:#fff}
.qm-np-play:hover:not(:disabled){background:var(--dsw-alias-brand-primary);filter:brightness(1.05);color:#fff}
.qm-np-play:active:not(:disabled){transform:scale(.96)}
.qm-spacer{flex:1}
.qm-popover-layer{position:absolute;inset:0;z-index:45}
.qm-popover-scrim{position:absolute;inset:0;border:0;background:transparent}
.qm-popover{position:absolute;top:52px;right:16px;z-index:50;width:min(360px,calc(100% - 32px));padding:14px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-overlay);box-shadow:0 22px 60px rgba(0,0,0,.28)}
.qm-popover-title{font-size:13px;font-weight:600;margin-bottom:4px}
.qm-popover-hint{font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary);margin-bottom:10px}
.qm-popover textarea{width:100%;box-sizing:border-box;min-height:64px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:7px 9px;margin-bottom:9px}
.qm-popover textarea:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.qm-popover-actions{display:flex;align-items:center;gap:8px}
.qm-popover-status{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.qm-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.qm-chip.ok{color:var(--dsw-alias-state-success-primary);border-color:currentColor}
.qm-account{position:relative}
.qm-account-dot{position:absolute;right:3px;bottom:3px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary);border:1px solid var(--dsw-alias-bg-base)}
.qm-root button:focus-visible,.qm-root input:focus-visible,.qm-root select:focus-visible,.qm-root textarea:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
@keyframes qm-shimmer{to{background-position:-200% 0}}
@keyframes qm-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (max-width: 980px){
  .qm-search{width:180px}
  .qm-player-left{width:210px}
  .qm-player-progress{max-width:440px}
  .qm-hero{grid-template-columns:150px minmax(0,1fr);gap:18px}
  .qm-hero-art{width:150px;height:150px}
  .qm-hero-title{font-size:22px}
  .qm-np-body{grid-template-columns:1fr;gap:18px;padding:0 24px 18px;align-items:start;overflow:auto}
  .qm-np-left{justify-content:center}
  .qm-np-art{width:min(240px,70%)}
  .qm-np-right{max-height:none;height:auto}
  .qm-np-lyrics{max-height:220px;min-height:120px;flex:none}
}
@media (max-width: 720px){
  .qm-brand span{display:none}
  .qm-home-columns{grid-template-columns:1fr}
  .qm-home-columns .qm-section > .qm-rows{max-height:420px}
  .qm-detail{flex-direction:column;align-items:flex-start}
  .qm-quality{display:none}
  .qm-volume{display:none}
  .qm-player-left{width:auto;flex:1}
  .qm-player-progress{display:none}
  .qm-search{width:140px}
  .qm-hero{grid-template-columns:1fr;gap:14px}
  .qm-hero-art{width:120px;height:120px}
  .qm-np-body{padding:0 16px 16px}
  .qm-content{padding:18px 16px 40px}
}
@media (prefers-reduced-motion: reduce){
  .qm-root *{animation:none !important;transition:none !important}
}
@media (prefers-reduced-transparency: reduce){
  .qm-toolbar{background:var(--dsw-alias-bg-base);backdrop-filter:none;-webkit-backdrop-filter:none}
}
`

    /* ------------------------------------------------------------ */
    /* sidebar icon                                                  */
    /* ------------------------------------------------------------ */

    function PanelIcon(props) {
      const size = props && props.size ? props.size : 18
      const active = Boolean(props && props.active)
      const color = active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)'
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          onClick: requestHome,
          style: { display: 'block', cursor: 'pointer' },
        },
        h('path', {
          d: 'M15.4 4.2v10.6a3.3 3.3 0 1 1-1.7-2.9V7.8l-5.3 1.2v6.6a3.3 3.3 0 1 1-1.7-2.9V6.6c0-.7.5-1.3 1.2-1.4l6.3-1.4c.7-.2 1.2.3 1.2 1z',
          fill: color,
        }),
      )
    }

    /* ------------------------------------------------------------ */
    /* panel                                                         */
    /* ------------------------------------------------------------ */

    function createPanel(ctx) {
      return function QqMusicPanel() {
        const [status, setStatus] = React.useState(null)
        const [statusError, setStatusError] = React.useState(null)
        const [home, setHome] = React.useState(null)
        const [homeLoading, setHomeLoading] = React.useState(false)
        const [homeError, setHomeError] = React.useState(null)
        const [homeRadioLoading, setHomeRadioLoading] = React.useState(false)
        const [playlists, setPlaylists] = React.useState([])
        const [libraryFilter, setLibraryFilter] = React.useState('')
        const [view, setView] = React.useState({ kind: 'home', from: null })
        const [tracks, setTracks] = React.useState([])
        const [listLoading, setListLoading] = React.useState(false)
        const [query, setQuery] = React.useState('')
        const [searching, setSearching] = React.useState(false)
        const [notice, setNotice] = React.useState(null)
        const [busyFav, setBusyFav] = React.useState(false)
        const [loginBusy, setLoginBusy] = React.useState(false)
        const [loginOpen, setLoginOpen] = React.useState(false)
        const [cookieText, setCookieText] = React.useState('')
        const [quarterMids, setQuarterMids] = React.useState(() => new Set())
        const [lyricLines, setLyricLines] = React.useState([])
        const [lyricError, setLyricError] = React.useState(null)
        const [playerOpen, setPlayerOpen] = React.useState(false)
        const [queueOpen, setQueueOpen] = React.useState(false)
        const [actualQuality, setActualQuality] = React.useState('')
        const [, forceStore] = React.useReducer((value) => value + 1, 0)

        React.useEffect(() => playerStore.subscribe(forceStore), [])
        React.useEffect(() => {
          player.notice = (message) => setNotice(message)
          return () => {
            player.notice = null
          }
        }, [])

        const { queue, index, playing, time, duration, mode, quality, volume } = playerStore.state

        const lyricsBoxRef = React.useRef(null)
        const npRef = React.useRef(null)
        const contentRef = React.useRef(null)
        const radioSeenRef = React.useRef(new Set())
        const [, forceRender] = React.useReducer((value) => value + 1, 0)

        const current = index >= 0 && queue[index] ? queue[index] : null

        React.useEffect(() => {
          const off = ctx.locale.subscribe(forceRender)
          return () => {
            if (typeof off === 'function') off()
          }
        }, [])

        async function loadQuarter(name) {
          if (!name) return null
          const data = await apiGet(`/playlist?name=${encodeURIComponent(name)}`)
          setQuarterMids(new Set((data.songs || []).map((song) => song.mid)))
          return data
        }

        async function loadHome(force) {
          if (!force && home) return
          if (!force) {
            const cached = readHomeCache()
            if (cached) {
              radioSeenRef.current = new Set(cached.seen || [])
              for (const song of (cached.data.radio && cached.data.radio.songs) || []) {
                radioSeenRef.current.add(song.mid)
              }
              setHome(cached.data)
              setHomeError(null)
              setHomeLoading(false)
              return
            }
          }
          if (force) radioSeenRef.current = new Set()
          setHomeLoading(true)
          setHomeError(null)
          try {
            const data = await apiGet(force ? '/home?refresh=1' : '/home')
            setHome(data)
            for (const song of (data.radio && data.radio.songs) || []) {
              radioSeenRef.current.add(song.mid)
            }
            writeHomeCache(data, radioSeenRef.current)
          } catch (error) {
            setHomeError(error)
          } finally {
            setHomeLoading(false)
          }
        }

        const refreshAll = React.useCallback(async () => {
          setStatusError(null)
          try {
            const data = await apiGet('/status')
            setStatus(data)
            await loadQuarter(data.quarter)
          } catch (error) {
            setStatus(null)
            setStatusError(error)
          }
          try {
            const data = await apiGet('/playlists')
            setPlaylists(data.playlists || [])
          } catch {
            // /status already surfaces the login problem
          }
        }, [])

        React.useEffect(() => {
          const handler = () => setView({ kind: 'home', from: null })
          homeListeners.add(handler)
          return () => homeListeners.delete(handler)
        }, [])

        React.useEffect(() => {
          refreshAll()
        }, [refreshAll])

        React.useEffect(() => {
          loadHome()
        }, [])

        React.useEffect(() => {
          if (!current) {
            setActualQuality('')
            return undefined
          }
          let alive = true
          const params = new URLSearchParams({ mid: current.mid, quality })
          if (current.mediaMid) params.set('mediaMid', current.mediaMid)
          apiGet(`/songurl?${params.toString()}`)
            .then((data) => {
              if (alive) setActualQuality(data.badge || '')
            })
            .catch(() => {
              if (alive) setActualQuality('')
            })
          return () => {
            alive = false
          }
        }, [current ? current.mid : null, quality])

        React.useEffect(() => {
          if (!current) {
            setLyricLines([])
            setLyricError(null)
            return undefined
          }
          let alive = true
          setLyricLines([])
          setLyricError(null)
          apiGet(`/lyric?mid=${encodeURIComponent(current.mid)}`)
            .then((data) => {
              if (alive) setLyricLines(parseLrc(data.lyric))
            })
            .catch((error) => {
              if (alive) setLyricError(error.message)
            })
          return () => {
            alive = false
          }
        }, [current ? current.mid : null])

        React.useEffect(() => {
          if (!current && playerOpen) setPlayerOpen(false)
        }, [current ? current.mid : null, playerOpen])

        React.useEffect(() => {
          const box = lyricsBoxRef.current
          if (!box || !playerOpen) return
          const line = box.querySelector('[data-active="true"]')
          if (!line) return
          box.scrollTop = Math.max(0, line.offsetTop - box.clientHeight / 2)
        }, [playerOpen, time, lyricLines])

        React.useEffect(() => {
          const content = contentRef.current
          if (!content) return
          content.scrollTop = 0
        }, [view.kind, view.playlist ? view.playlist.dirId : null])

        React.useEffect(() => {
          if (playerOpen && npRef.current) npRef.current.focus()
        }, [playerOpen])

        React.useEffect(() => {
          function onKey(event) {
            if (event.key !== 'Escape') return
            if (playerOpen) setPlayerOpen(false)
            else if (queueOpen) setQueueOpen(false)
            else if (loginOpen) setLoginOpen(false)
          }
          window.addEventListener('keydown', onKey)
          return () => window.removeEventListener('keydown', onKey)
        }, [playerOpen, queueOpen, loginOpen])

        const activeLine = React.useMemo(() => {
          let found = -1
          for (let i = 0; i < lyricLines.length; i += 1) {
            if (lyricLines[i].t <= time + 0.25) found = i
            else break
          }
          return found
        }, [lyricLines, time])

        /* ---------------------------- actions ---------------------------- */

        async function submitSearch(event) {
          if (event) event.preventDefault()
          const text = query.trim()
          if (!text || searching) return
          setSearching(true)
          setNotice(null)
          try {
            const data = await apiGet(`/search?q=${encodeURIComponent(text)}&limit=30`)
            setTracks(data.songs || [])
            setView({ kind: 'search', query: text, from: null })
          } catch (error) {
            setNotice({ kind: 'error', text: error.message })
          } finally {
            setSearching(false)
          }
        }

        function clearSearch() {
          setQuery('')
          if (view.kind === 'search') openHome(false)
        }

        function openHome(force) {
          setView({ kind: 'home', from: null })
          loadHome(Boolean(force))
        }

        function openLibrary() {
          setView({ kind: 'library', from: null })
        }

        function refreshCurrent() {
          refreshAll()
          if (view.kind === 'home') loadHome(true)
        }

        async function refreshHomeRadio() {
          if (homeRadioLoading) return
          setHomeRadioLoading(true)
          setNotice(null)
          try {
            const exclude = Array.from(radioSeenRef.current).join(',')
            const data = await apiGet(`/radio?limit=16${exclude ? `&exclude=${encodeURIComponent(exclude)}` : ''}`)
            if (!data.songs || data.songs.length === 0) {
              setNotice({ kind: 'info', text: t('radio.empty') })
            } else {
              for (const song of data.songs) radioSeenRef.current.add(song.mid)
              const next = home ? { ...home, radio: { name: data.name, songs: data.songs } } : home
              if (next) {
                setHome(next)
                writeHomeCache(next, radioSeenRef.current)
              }
            }
          } catch (error) {
            setNotice({ kind: 'error', text: error.message })
          } finally {
            setHomeRadioLoading(false)
          }
        }

        async function openQuarter() {
          const name = status && status.quarter ? status.quarter : ''
          setView({ kind: 'quarter', from: 'library' })
          setListLoading(true)
          try {
            const data = await loadQuarter(name)
            if (data) {
              setTracks(data.songs || [])
              if (data.playlist && data.playlist.exists === false) {
                setNotice({ kind: 'info', text: t('quarter.missing') })
              }
            }
          } catch (error) {
            setNotice({ kind: 'error', text: error.message })
          } finally {
            setListLoading(false)
          }
        }

        async function openPlaylist(playlist, from) {
          setView({ kind: 'playlist', playlist, from: from || 'library' })
          setListLoading(true)
          setNotice(null)
          try {
            const data = await apiGet(
              `/playlist?dirId=${playlist.dirId}&tid=${playlist.tid}&name=${encodeURIComponent(playlist.name)}`,
            )
            setTracks(data.songs || [])
          } catch (error) {
            setNotice({ kind: 'error', text: error.message })
          } finally {
            setListLoading(false)
          }
        }

        function goBack() {
          if (view.from === 'home') openHome(false)
          else openLibrary()
        }

        function playList(list, start) {
          playerPlayList(list, start)
        }

        function step(delta) {
          playerStep(delta)
        }

        function togglePlay() {
          if (!current) {
            if (tracks.length > 0) playerPlayList(tracks, 0)
            return
          }
          playerToggle()
        }

        function seek(event) {
          playerSeek(Number(event.target.value))
        }

        function seekTo(seconds) {
          playerSeek(seconds)
        }

        function cycleMode() {
          playerCycleMode()
        }

        function changeQuality(next) {
          playerChangeQuality(next)
        }

        async function favorite(track) {
          if (!track || busyFav) return false
          setBusyFav(true)
          setNotice(null)
          try {
            const result = await apiPost('/fav', { mid: track.mid })
            setQuarterMids((previous) => {
              const next = new Set(previous)
              next.add(track.mid)
              return next
            })
            setStatus((previous) =>
              previous ? { ...previous, playlist: { ...(previous.playlist || {}), ...result.playlist } } : previous,
            )
            setNotice({
              kind: 'ok',
              text: result.duplicate
                ? t('fav.duplicate', { name: result.playlist.name, count: result.count })
                : t('fav.success', { name: result.playlist.name, count: result.count }),
            })
            if (view.kind === 'quarter') {
              const data = await loadQuarter(result.playlist.name)
              if (data) setTracks(data.songs || [])
            }
            return true
          } catch (error) {
            setNotice({ kind: 'error', text: error.message, hint: error.login ? t('error.loginHint') : '' })
            return false
          } finally {
            setBusyFav(false)
          }
        }

        async function favoriteSystem() {
          if (busyFav) return
          setBusyFav(true)
          setNotice(null)
          try {
            const result = await apiPost('/fav', { system: true })
            setQuarterMids((previous) => {
              const next = new Set(previous)
              next.add(result.track.mid)
              return next
            })
            setStatus((previous) =>
              previous ? { ...previous, playlist: { ...(previous.playlist || {}), ...result.playlist } } : previous,
            )
            setNotice({
              kind: 'ok',
              text: result.duplicate
                ? t('fav.duplicate', { name: result.playlist.name, count: result.count })
                : t('fav.success', { name: result.playlist.name, count: result.count }),
            })
            if (view.kind === 'quarter') {
              const data = await loadQuarter(result.playlist.name)
              if (data) setTracks(data.songs || [])
            }
          } catch (error) {
            setNotice({ kind: 'error', text: error.message })
          } finally {
            setBusyFav(false)
          }
        }

        async function submitCookie() {
          const value = cookieText.trim()
          if (!value || loginBusy) return
          setLoginBusy(true)
          setNotice(null)
          try {
            await apiPost('/login', { cookie: value })
            setNotice({ kind: 'ok', text: t('login.saved') })
            setCookieText('')
            setLoginOpen(false)
            setStatusError(null)
            await refreshAll()
            await loadHome(true)
          } catch (error) {
            setNotice({ kind: 'error', text: `${t('login.invalid')}：${error.message}` })
          } finally {
            setLoginBusy(false)
          }
        }

        /* ----------------------------- render ----------------------------- */

        const homeActive = view.kind === 'home' || (view.kind === 'playlist' && view.from === 'home')
        const libraryActive =
          ['library', 'quarter'].includes(view.kind) || (view.kind === 'playlist' && view.from !== 'home')

        const totalSeconds = duration || (current ? Number(current.interval) || 0 : 0)
        const progressValue = Math.min(time, totalSeconds || 0)
        const progressPct = totalSeconds > 0 ? Math.min(100, (time / totalSeconds) * 100) : 0

        function renderTrackRow(track, position, list) {
          const active = Boolean(current && current.mid === track.mid)
          const favorited = quarterMids.has(track.mid)
          return h(
            'div',
            {
              key: `${track.mid}-${position}`,
              className: `qm-row${active ? ' active' : ''}`,
            },
            h(
              'button',
              {
                className: 'qm-row-hit',
                onClick: () => playList(list, position),
                title: track.title,
                'aria-label': `${track.title}${track.artist ? ` — ${track.artist}` : ''}`,
              },
              h(Cover, { track, size: 36, radius: 6 }),
              h(
                'div',
                { className: 'qm-row-main' },
                h('div', { className: 'qm-row-title' }, track.title + (track.subtitle ? `（${track.subtitle}）` : '')),
                h('div', { className: 'qm-row-sub' }, [track.artist, track.album].filter(Boolean).join(' · ') || '—'),
              ),
              h('span', { className: 'qm-row-meta' }, fmtTime(track.interval)),
            ),
            h(
              'button',
              {
                className: `qm-iconbtn qm-heart${favorited ? ' on' : ''}`,
                disabled: busyFav || favorited,
                title: favorited ? t('action.faved') : t('action.fav'),
                'aria-label': favorited ? t('action.faved') : t('action.fav'),
                onClick: () => favorite(track),
              },
              h(HeartIcon, { size: 15, filled: favorited }),
            ),
          )
        }

        function renderRows(list) {
          if (list.length === 0) {
            if (listLoading) {
              return h(
                'div',
                { className: 'qm-rows' },
                [0, 1, 2, 3, 4].map((key) => h('div', { key, className: 'qm-skeleton' })),
              )
            }
            return h(
              'div',
              { className: 'qm-empty' },
              h('div', { className: 'qm-empty-title' }, t('search.noresult')),
              h('div', null, view.kind === 'quarter' ? t('empty.quarter') : t('empty.playlist')),
            )
          }
          return h(
            'div',
            { className: 'qm-rows' },
            list.map((track, position) => renderTrackRow(track, position, list)),
          )
        }

        function section(title, subtitle, actions, children) {
          return h(
            'section',
            { className: 'qm-section' },
            h(
              'div',
              { className: 'qm-section-head' },
              h('div', { className: 'qm-section-title' }, title),
              subtitle ? h('span', { className: 'qm-section-sub' }, subtitle) : null,
              actions ? h('div', { className: 'qm-section-actions' }, actions) : null,
            ),
            children,
          )
        }

        function pageHead(title, subtitle, actions) {
          return h(
            'div',
            { className: 'qm-page-head' },
            h('div', { className: 'qm-page-title' }, title),
            subtitle ? h('span', { className: 'qm-page-sub' }, subtitle) : null,
            actions ? h('div', { className: 'qm-page-actions' }, actions) : null,
          )
        }

        function renderHome() {
          if (homeLoading && !home) {
            return h(
              'div',
              { className: 'qm-page' },
              h('div', { className: 'qm-skeleton', style: { height: 168, borderRadius: 16 } }),
              h(
                'div',
                { className: 'qm-home-columns', style: { marginTop: 22 } },
                h('div', null, [0, 1, 2, 3, 4].map((key) => h('div', { key, className: 'qm-skeleton' }))),
                h('div', null, [0, 1, 2, 3].map((key) => h('div', { key, className: 'qm-skeleton' }))),
              ),
            )
          }
          if (homeError && !home) {
            return h(
              'div',
              { className: 'qm-page' },
              h(
                'div',
                { className: 'qm-empty' },
                h('div', { className: 'qm-empty-title' }, t('home.error')),
                h('div', null, homeError.message),
                h('button', { className: 'qm-btn', onClick: () => loadHome(true) }, t('action.retry')),
              ),
            )
          }
          if (!home) return null
          const daily = home.daily

          const hero = daily
            ? h(
                'div',
                { className: 'qm-hero' },
                daily.cover
                  ? h('img', { className: 'qm-hero-art', src: daily.cover, alt: '' })
                  : h('div', { className: 'qm-hero-art qm-cover-fallback' }, h(MusicIcon, { size: 36 })),
                h(
                  'div',
                  { className: 'qm-hero-body' },
                  h('div', { className: 'qm-eyebrow' }, t('home.date', { date: daily.date })),
                  h('h2', { className: 'qm-hero-title' }, t('home.daily')),
                  daily.desc ? h('p', { className: 'qm-hero-desc' }, daily.desc) : null,
                  h(
                    'div',
                    { className: 'qm-hero-actions' },
                    h(
                      'button',
                      { className: 'qm-btn primary', onClick: () => playList(daily.songs, 0) },
                      h(PlayIcon, { size: 13 }),
                      t('action.playAll'),
                    ),
                    h(
                      'button',
                      { className: 'qm-btn', disabled: busyFav, onClick: favoriteSystem },
                      h(HeartIcon, { size: 13 }),
                      busyFav ? t('fav.working') : t('action.favSystem'),
                    ),
                  ),
                ),
              )
            : h(
                'div',
                { className: 'qm-toast' },
                h(
                  'div',
                  { className: 'qm-toast-text' },
                  h('div', null, t('home.unavailable')),
                  home.dailyNote ? h('div', { style: { opacity: 0.85 } }, home.dailyNote) : null,
                ),
                h('button', { className: 'qm-btn ghost', onClick: () => loadHome(true) }, t('action.retry')),
              )

          const dailySection = daily
            ? section(
                t('home.daily'),
                `${daily.songs.length} ${t('unit.songs')}`,
                h(
                  'button',
                  { className: 'qm-btn ghost', onClick: () => playList(daily.songs, 0) },
                  h(PlayIcon, { size: 13 }),
                  t('action.playAll'),
                ),
                h(
                  'div',
                  { className: 'qm-rows' },
                  daily.songs.map((song, position) => renderTrackRow(song, position, daily.songs)),
                ),
              )
            : null

          const radioSection =
            home.radio && home.radio.songs.length > 0
              ? section(
                  t('home.radio'),
                  `${home.radio.songs.length} ${t('unit.songs')}`,
                  h(
                    React.Fragment,
                    null,
                    h(
                      'button',
                      { className: 'qm-btn ghost', onClick: () => playList(home.radio.songs, 0) },
                      h(PlayIcon, { size: 13 }),
                      t('action.playAll'),
                    ),
                    h(
                      'button',
                      { className: 'qm-btn ghost', disabled: homeRadioLoading, onClick: refreshHomeRadio },
                      h(RefreshIcon, { size: 13 }),
                      homeRadioLoading ? t('radio.loading') : t('radio.refresh'),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'qm-rows' },
                    home.radio.songs.map((song, position) => renderTrackRow(song, position, home.radio.songs)),
                  ),
                )
              : null

          const playlistsSection =
            home.playlists && home.playlists.length > 0
              ? section(
                  t('home.playlists'),
                  null,
                  null,
                  h(
                    'div',
                    { className: 'qm-shelf' },
                    home.playlists.map((playlist) =>
                      h(
                        'button',
                        {
                          key: `${playlist.dirId}-${playlist.tid}`,
                          className: 'qm-card',
                          onClick: () => openPlaylist(playlist, 'home'),
                          title: playlist.name,
                        },
                        playlist.cover
                          ? h('img', { className: 'qm-card-art', src: playlist.cover, alt: '', loading: 'lazy' })
                          : h('div', { className: 'qm-card-art qm-cover-fallback' }, h(MusicIcon, { size: 28 })),
                        h('div', { className: 'qm-card-name' }, playlist.name),
                        h(
                          'div',
                          { className: 'qm-card-meta' },
                          [playlist.creator, playlist.songNum ? `${playlist.songNum} ${t('unit.songs')}` : '']
                            .filter(Boolean)
                            .join(' · '),
                        ),
                      ),
                    ),
                  ),
                )
              : null

          return h(
            'div',
            { className: 'qm-page' },
            hero,
            dailySection || radioSection
              ? h(
                  'div',
                  { className: `qm-home-columns${dailySection && radioSection ? '' : ' single'}` },
                  dailySection,
                  radioSection,
                )
              : null,
            playlistsSection,
          )
        }

        function renderLibrary() {
          const filter = libraryFilter.trim().toLowerCase()
          const visible = playlists.filter((playlist) => !filter || playlist.name.toLowerCase().includes(filter))
          return h(
            'div',
            { className: 'qm-page' },
            pageHead(
              t('library.title'),
              t('unit.playlists', { count: playlists.length }),
              h('input', {
                className: 'qm-filter',
                value: libraryFilter,
                placeholder: t('library.filter'),
                'aria-label': t('library.filter'),
                onChange: (event) => setLibraryFilter(event.target.value),
              }),
            ),
            h(
              'button',
              { className: 'qm-quarter', onClick: openQuarter },
              h('div', { className: 'qm-quarter-icon' }, h(HeartIcon, { size: 18, filled: true })),
              h(
                'div',
                { className: 'qm-quarter-text' },
                h(
                  'div',
                  { className: 'qm-quarter-title' },
                  `${t('library.quarter')} · ${status ? status.quarter : ''}`,
                ),
                h(
                  'div',
                  { className: 'qm-quarter-sub' },
                  `${status && status.playlist ? status.playlist.songNum : 0} ${t('unit.songs')} · ${t('quarter.hint')}`,
                ),
              ),
              h(ChevronRightIcon, { size: 16 }),
            ),
            visible.length === 0
              ? h(
                  'div',
                  { className: 'qm-empty' },
                  h('div', { className: 'qm-empty-title' }, t('library.empty')),
                )
              : h(
                  'div',
                  { className: 'qm-grid' },
                  visible.map((playlist) =>
                    h(
                      'button',
                      {
                        key: `${playlist.dirId}-${playlist.tid}`,
                        className: 'qm-card',
                        onClick: () => openPlaylist(playlist, 'library'),
                        title: playlist.name,
                      },
                      playlist.picUrl
                        ? h('img', { className: 'qm-card-art', src: playlist.picUrl, alt: '', loading: 'lazy' })
                        : h('div', { className: 'qm-card-art qm-cover-fallback' }, h(MusicIcon, { size: 28 })),
                      h('div', { className: 'qm-card-name' }, playlist.name),
                      h('div', { className: 'qm-card-meta' }, `${playlist.songNum} ${t('unit.songs')}`),
                    ),
                  ),
                ),
          )
        }

        function renderPlaylist() {
          const playlist = view.playlist || {}
          const cover = playlist.picUrl || playlist.cover || ''
          return h(
            'div',
            { className: 'qm-page' },
            h(
              'div',
              { className: 'qm-detail' },
              cover
                ? h('img', { className: 'qm-detail-art', src: cover, alt: '' })
                : h('div', { className: 'qm-detail-art qm-cover-fallback' }, h(MusicIcon, { size: 36 })),
              h(
                'div',
                { className: 'qm-detail-body' },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  h(
                    'button',
                    { className: 'qm-iconbtn', onClick: goBack, title: t('action.back'), 'aria-label': t('action.back') },
                    h(ChevronLeftIcon, { size: 16 }),
                  ),
                  h('span', { className: 'qm-eyebrow' }, t('library.title')),
                ),
                h('div', { className: 'qm-detail-title' }, playlist.name || t('panel.title')),
                h(
                  'div',
                  { className: 'qm-detail-sub' },
                  `${tracks.length} ${t('unit.songs')}${playlist.creator ? ` · ${playlist.creator}` : ''}`,
                ),
                h(
                  'div',
                  { style: { marginTop: 14 } },
                  h(
                    'button',
                    { className: 'qm-btn primary', onClick: () => playList(tracks, 0) },
                    h(PlayIcon, { size: 13 }),
                    t('action.playAll'),
                  ),
                ),
              ),
            ),
            renderRows(tracks),
          )
        }

        function renderQuarter() {
          return h(
            'div',
            { className: 'qm-page' },
            pageHead(
              `${t('library.quarter')} · ${status ? status.quarter : ''}`,
              listLoading ? t('search.searching') : `${tracks.length} ${t('unit.songs')}`,
              h(
                React.Fragment,
                null,
                h(
                  'button',
                  { className: 'qm-btn ghost', onClick: goBack, title: t('action.back') },
                  h(ChevronLeftIcon, { size: 14 }),
                  t('action.back'),
                ),
                tracks.length > 0
                  ? h(
                      'button',
                      { className: 'qm-btn primary', onClick: () => playList(tracks, 0) },
                      h(PlayIcon, { size: 13 }),
                      t('action.playAll'),
                    )
                  : null,
                h(
                  'button',
                  { className: 'qm-btn', disabled: busyFav, onClick: favoriteSystem },
                  h(HeartIcon, { size: 13 }),
                  busyFav ? t('fav.working') : t('action.favSystem'),
                ),
              ),
            ),
            renderRows(tracks),
          )
        }

        function renderSearch() {
          return h(
            'div',
            { className: 'qm-page' },
            pageHead(
              view.query ? t('search.title', { q: view.query }) : t('search.empty'),
              searching ? t('search.searching') : `${tracks.length} ${t('unit.songs')}`,
              h(
                React.Fragment,
                null,
                tracks.length > 0
                  ? h(
                      'button',
                      { className: 'qm-btn primary', onClick: () => playList(tracks, 0) },
                      h(PlayIcon, { size: 13 }),
                      t('action.playAll'),
                    )
                  : null,
                h(
                  'button',
                  { className: 'qm-btn ghost', onClick: clearSearch },
                  h(XIcon, { size: 13 }),
                  t('search.clear'),
                ),
              ),
            ),
            renderRows(tracks),
          )
        }

        function renderContent() {
          if (statusError && !status) {
            return h(
              'div',
              { className: 'qm-page' },
              h(
                'div',
                { className: 'qm-empty' },
                h('div', { className: 'qm-empty-title' }, statusError.login ? t('error.login') : t('error.load')),
                h('div', null, statusError.message),
                h(
                  'div',
                  { style: { display: 'flex', gap: 8 } },
                  h('button', { className: 'qm-btn primary', onClick: () => setLoginOpen(true) }, t('action.login')),
                  h('button', { className: 'qm-btn', onClick: refreshCurrent }, t('action.retry')),
                ),
              ),
            )
          }
          if (view.kind === 'library') return renderLibrary()
          if (view.kind === 'playlist') return renderPlaylist()
          if (view.kind === 'quarter') return renderQuarter()
          if (view.kind === 'search') return renderSearch()
          return renderHome()
        }

        const noticeBox = notice
          ? h(
              'div',
              { className: `qm-toast ${notice.kind || ''}`, role: 'status', 'aria-live': 'polite' },
              h(
                'div',
                { className: 'qm-toast-text' },
                h('div', null, notice.text),
                notice.hint ? h('div', { style: { marginTop: 2, opacity: 0.9 } }, notice.hint) : null,
              ),
              h(
                'button',
                { className: 'qm-iconbtn', onClick: () => setNotice(null), title: t('notice.close'), 'aria-label': t('notice.close') },
                h(XIcon, { size: 13 }),
              ),
            )
          : null

        const toolbar = h(
          'header',
          { className: 'qm-toolbar' },
          h(
            'button',
            {
              className: 'qm-nav qm-brand',
              onClick: () => openHome(false),
              title: t('tab.home'),
              'aria-label': t('tab.home'),
              'aria-current': homeActive ? 'page' : undefined,
            },
            h('div', { className: 'qm-logo' }, h(MusicIcon, { size: 15 })),
            h('span', null, t('panel.title')),
          ),
          h(
            'nav',
            { className: 'qm-navbar', 'aria-label': t('panel.title') },
            h(
              'button',
              {
                className: 'qm-nav',
                onClick: openLibrary,
                'aria-current': libraryActive ? 'page' : undefined,
              },
              t('tab.library'),
            ),
          ),
          h(
            'div',
            { className: 'qm-toolbar-right' },
            h(
              'form',
              { className: 'qm-search', onSubmit: submitSearch, role: 'search' },
              h(SearchIcon, { size: 14 }),
              h('input', {
                value: query,
                placeholder: t('search.placeholder'),
                'aria-label': t('search.placeholder'),
                onChange: (event) => setQuery(event.target.value),
              }),
              query
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'qm-iconbtn',
                      style: { width: 20, height: 20 },
                      onClick: clearSearch,
                      title: t('search.clear'),
                      'aria-label': t('search.clear'),
                    },
                    h(XIcon, { size: 12 }),
                  )
                : null,
            ),
            h(
              'button',
              {
                className: 'qm-iconbtn qm-account',
                onClick: () => setLoginOpen((value) => !value),
                title: t('action.login'),
                'aria-label': t('action.login'),
                'aria-expanded': loginOpen,
              },
              h(UserIcon, { size: 16 }),
              status ? h('span', { className: 'qm-account-dot', 'aria-hidden': true }) : null,
            ),
            h(
              'button',
              { className: 'qm-iconbtn', onClick: refreshCurrent, title: t('action.refresh'), 'aria-label': t('action.refresh') },
              h(RefreshIcon, { size: 15 }),
            ),
          ),
        )

        const playerBar = h(
          'footer',
          { className: 'qm-player' },
          h(
            'div',
            { className: 'qm-player-left' },
            h(
              'button',
              {
                className: 'qm-player-info',
                disabled: !current,
                onClick: () => setPlayerOpen(true),
                title: t('player.expand'),
                'aria-label': t('player.expand'),
              },
              current
                ? h(Cover, { track: current, size: 44, radius: 8, className: 'qm-player-art' })
                : h('div', { className: 'qm-player-art qm-cover-fallback' }, h(MusicIcon, { size: 18 })),
              h(
                'div',
                { className: 'qm-player-text' },
                h('div', { className: 'qm-player-title' }, current ? current.title : t('player.idle')),
                h('div', { className: 'qm-player-sub' }, current ? current.artist || '—' : t('player.idleHint')),
              ),
            ),
            h(
              'button',
              {
                className: `qm-iconbtn qm-heart${current && quarterMids.has(current.mid) ? ' on' : ''}`,
                disabled: !current || busyFav || Boolean(current && quarterMids.has(current.mid)),
                onClick: () => {
                  if (current) favorite(current)
                },
                title: current && quarterMids.has(current.mid) ? t('action.faved') : t('action.fav'),
                'aria-label': current && quarterMids.has(current.mid) ? t('action.faved') : t('action.fav'),
              },
              h(HeartIcon, { size: 15, filled: Boolean(current && quarterMids.has(current.mid)) }),
            ),
          ),
          h(
            'div',
            { className: 'qm-player-center' },
            h(
              'div',
              { className: 'qm-player-buttons' },
              h(
                'button',
                { className: 'qm-iconbtn', disabled: !current, onClick: () => step(-1), title: t('action.prev'), 'aria-label': t('action.prev') },
                h(PrevIcon, { size: 15 }),
              ),
              h(
                'button',
                {
                  className: 'qm-iconbtn qm-player-play',
                  disabled: !current,
                  onClick: togglePlay,
                  title: playing ? t('action.pause') : t('action.play'),
                  'aria-label': playing ? t('action.pause') : t('action.play'),
                },
                playing ? h(PauseIcon, { size: 15 }) : h(PlayIcon, { size: 15 }),
              ),
              h(
                'button',
                { className: 'qm-iconbtn', disabled: !current, onClick: () => step(1), title: t('action.next'), 'aria-label': t('action.next') },
                h(NextIcon, { size: 15 }),
              ),
              h(
                'button',
                {
                  className: `qm-iconbtn${mode !== 'order' ? ' on' : ''}`,
                  onClick: cycleMode,
                  title: `${t('mode.label')}：${t('mode.' + mode)}`,
                  'aria-label': `${t('mode.label')}：${t('mode.' + mode)}`,
                },
                h(ModeIcon, { mode, size: 15 }),
              ),
            ),
            h(
              'div',
              { className: 'qm-player-progress' },
              h('span', { className: 'qm-time' }, fmtTime(time)),
              h('input', {
                type: 'range',
                className: 'qm-range',
                min: 0,
                max: Math.max(totalSeconds, 0.1),
                step: 0.1,
                value: progressValue,
                disabled: !current,
                onChange: seek,
                'aria-label': t('player.seek'),
              }),
              h('span', { className: 'qm-time' }, fmtTime(totalSeconds)),
            ),
          ),
          h(
            'div',
            { className: 'qm-player-right' },
            h(
              'label',
              { className: 'qm-quality', title: t('quality.label') },
              h(
                'select',
                {
                  value: quality,
                  onChange: (event) => changeQuality(event.target.value),
                  'aria-label': t('quality.label'),
                },
                ['standard', 'high', 'lossless'].map((option) =>
                  h('option', { key: option, value: option }, t(`quality.${option}`)),
                ),
              ),
              actualQuality ? h('span', { className: 'qm-qbadge' }, actualQuality) : null,
            ),
            h(
              'div',
              { className: 'qm-volume' },
              h(VolumeIcon, { size: 14 }),
              h('input', {
                type: 'range',
                className: 'qm-range',
                min: 0,
                max: 1,
                step: 0.01,
                value: volume,
                onChange: (event) => playerSetVolume(Number(event.target.value)),
                'aria-label': t('player.volume'),
              }),
            ),
            h(
              'button',
              {
                className: 'qm-iconbtn',
                disabled: queue.length === 0,
                onClick: () => setQueueOpen((value) => !value),
                title: t('queue.title'),
                'aria-label': t('queue.title'),
                'aria-expanded': queueOpen,
              },
              h(QueueIcon, { size: 16 }),
            ),
            h(
              'button',
              {
                className: 'qm-iconbtn',
                disabled: !current,
                onClick: () => setPlayerOpen(true),
                title: t('player.expand'),
                'aria-label': t('player.expand'),
              },
              h(ChevronUpIcon, { size: 16 }),
            ),
          ),
        )

        const queuePanel = queueOpen
          ? h(
              'div',
              { className: 'qm-queue', role: 'dialog', 'aria-label': t('queue.title') },
              h(
                'div',
                { className: 'qm-queue-head' },
                h('span', null, t('queue.title')),
                h('span', { className: 'qm-queue-count' }, `${queue.length} ${t('unit.songs')}`),
                h(
                  'button',
                  { className: 'qm-iconbtn', onClick: () => setQueueOpen(false), title: t('action.close'), 'aria-label': t('action.close') },
                  h(XIcon, { size: 13 }),
                ),
              ),
              queue.length === 0
                ? h('div', { className: 'qm-empty', style: { padding: '24px 12px' } }, t('queue.empty'))
                : h(
                    'div',
                    { className: 'qm-queue-list' },
                    queue.map((track, position) =>
                      h(
                        'button',
                        {
                          key: `${track.mid}-${position}`,
                          className: `qm-queue-item${position === index ? ' active' : ''}`,
                          onClick: () => {
                            playerJumpTo(position)
                            setQueueOpen(false)
                          },
                        },
                        h('span', { className: 'qm-queue-index' }, String(position + 1)),
                        h(
                          'span',
                          { className: 'qm-queue-main' },
                          h('span', { className: 'qm-queue-title' }, track.title),
                          h('span', { className: 'qm-queue-artist' }, track.artist || ''),
                        ),
                        h('span', { className: 'qm-queue-time' }, fmtTime(track.interval)),
                      ),
                    ),
                  ),
            )
          : null

        const nowPlaying =
          playerOpen && current
            ? h(
                'section',
                { className: 'qm-np', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('np.title'), ref: npRef, tabIndex: -1 },
                current.albumMid
                  ? h('img', { className: 'qm-np-bg', src: coverUrl(current, 500), alt: '' })
                  : null,
                h('div', { className: 'qm-np-scrim' }),
                h(
                  'header',
                  { className: 'qm-np-head' },
                  h(
                    'button',
                    {
                      className: 'qm-iconbtn',
                      onClick: () => setPlayerOpen(false),
                      title: t('np.close'),
                      'aria-label': t('np.close'),
                    },
                    h(ChevronDownIcon, { size: 17 }),
                  ),
                  h('div', { className: 'qm-np-label' }, t('np.title')),
                  h(
                    'div',
                    { className: 'qm-np-head-right' },
                    h(
                      'label',
                      { className: 'qm-quality' },
                      t('quality.label'),
                      h(
                        'select',
                        {
                          value: quality,
                          onChange: (event) => changeQuality(event.target.value),
                          'aria-label': t('quality.label'),
                        },
                        ['standard', 'high', 'lossless'].map((option) =>
                          h('option', { key: option, value: option }, t(`quality.${option}`)),
                        ),
                      ),
                      actualQuality ? h('span', { className: 'qm-qbadge' }, actualQuality) : null,
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'qm-np-body' },
                  h(
                    'div',
                    { className: 'qm-np-left' },
                    h(Cover, { track: current, size: 340, radius: 20, className: 'qm-np-art', fill: true }),
                  ),
                  h(
                    'div',
                    { className: 'qm-np-right' },
                    h('div', { className: 'qm-np-title' }, current.title),
                    h('div', { className: 'qm-np-artist' }, current.artist || '—'),
                    h('div', { className: 'qm-np-album' }, current.album || ''),
                    h(
                      'div',
                      { className: 'qm-np-lyrics', ref: lyricsBoxRef },
                      lyricError
                        ? h('div', { className: 'qm-np-empty' }, lyricError)
                        : lyricLines.length === 0
                          ? h('div', { className: 'qm-np-empty' }, current ? t('lyric.empty') : '')
                          : lyricLines.map((line, position) =>
                              h(
                                'button',
                                {
                                  key: `${line.t}-${position}`,
                                  className: `qm-np-line${position === activeLine ? ' active' : ''}`,
                                  'data-active': position === activeLine ? 'true' : 'false',
                                  tabIndex: -1,
                                  onClick: () => seekTo(line.t),
                                },
                                line.text,
                              ),
                            ),
                    ),
                    h(
                      'div',
                      { className: 'qm-progress' },
                      h('span', { className: 'qm-time' }, fmtTime(time)),
                      h('input', {
                        type: 'range',
                        className: 'qm-range',
                        min: 0,
                        max: Math.max(totalSeconds, 0.1),
                        step: 0.1,
                        value: progressValue,
                        onChange: seek,
                        'aria-label': t('player.seek'),
                      }),
                      h('span', { className: 'qm-time' }, fmtTime(totalSeconds)),
                    ),
                    h(
                      'div',
                      { className: 'qm-np-controls' },
                      h(
                        'button',
                        {
                          className: `qm-btn${quarterMids.has(current.mid) ? '' : ' primary'}`,
                          disabled: busyFav || quarterMids.has(current.mid),
                          onClick: () => favorite(current),
                        },
                        h(HeartIcon, { size: 14, filled: quarterMids.has(current.mid) }),
                        quarterMids.has(current.mid) ? t('action.faved') : t('action.fav'),
                      ),
                      h(
                        'button',
                        { className: 'qm-iconbtn', onClick: () => step(-1), title: t('action.prev'), 'aria-label': t('action.prev') },
                        h(PrevIcon, { size: 16 }),
                      ),
                      h(
                        'button',
                        {
                          className: 'qm-iconbtn qm-np-play',
                          onClick: togglePlay,
                          title: playing ? t('action.pause') : t('action.play'),
                          'aria-label': playing ? t('action.pause') : t('action.play'),
                        },
                        playing ? h(PauseIcon, { size: 17 }) : h(PlayIcon, { size: 17 }),
                      ),
                      h(
                        'button',
                        { className: 'qm-iconbtn', onClick: () => step(1), title: t('action.next'), 'aria-label': t('action.next') },
                        h(NextIcon, { size: 16 }),
                      ),
                      h(
                        'button',
                        {
                          className: `qm-iconbtn${mode !== 'order' ? ' on' : ''}`,
                          onClick: cycleMode,
                          title: `${t('mode.label')}：${t('mode.' + mode)}`,
                          'aria-label': `${t('mode.label')}：${t('mode.' + mode)}`,
                        },
                        h(ModeIcon, { mode, size: 15 }),
                      ),
                      h('div', { className: 'qm-spacer' }),
                      h(
                        'div',
                        { className: 'qm-volume' },
                        h(VolumeIcon, { size: 14 }),
                        h('input', {
                          type: 'range',
                          className: 'qm-range',
                          min: 0,
                          max: 1,
                          step: 0.01,
                          value: volume,
                          onChange: (event) => playerSetVolume(Number(event.target.value)),
                          'aria-label': t('player.volume'),
                        }),
                      ),
                    ),
                  ),
                ),
              )
            : null

        const loginPopover = loginOpen
          ? h(
              'div',
              { className: 'qm-popover-layer' },
              h('div', {
                className: 'qm-popover-scrim',
                onClick: () => setLoginOpen(false),
                'aria-hidden': true,
              }),
              h(
                'div',
                { className: 'qm-popover', role: 'dialog', 'aria-label': t('login.title') },
                h('div', { className: 'qm-popover-title' }, t('login.title')),
                h(
                  'div',
                  { className: 'qm-popover-status' },
                  status
                    ? h(
                        'span',
                        { className: 'qm-chip ok' },
                        t('status.login', {
                          uin: status.login.uin,
                          source: t(`source.${status.login.source || 'client'}`),
                        }),
                      )
                    : h('span', { className: 'qm-chip' }, t('error.login')),
                  status && status.playlist
                    ? h('span', { className: 'qm-chip' }, t('status.playlist', { name: status.quarter }))
                    : null,
                ),
                h(
                  'div',
                  { className: 'qm-popover-hint' },
                  statusError ? `${statusError.message}。${t('error.loginHint')}` : t('login.hint'),
                ),
                h('textarea', {
                  value: cookieText,
                  placeholder: t('login.placeholder'),
                  spellCheck: false,
                  'aria-label': t('login.placeholder'),
                  onChange: (event) => setCookieText(event.target.value),
                }),
                h(
                  'div',
                  { className: 'qm-popover-actions' },
                  h(
                    'button',
                    { className: 'qm-btn primary', disabled: loginBusy || !cookieText.trim(), onClick: submitCookie },
                    loginBusy ? t('fav.working') : t('action.submit'),
                  ),
                  h('button', { className: 'qm-btn ghost', onClick: () => setLoginOpen(false) }, t('action.close')),
                ),
              ),
            )
          : null

        return h(
          'div',
          { className: 'qm-root' },
          h('style', null, CSS),
          toolbar,
          h('main', { className: 'qm-content', ref: contentRef }, noticeBox, renderContent()),
          playerBar,
          queuePanel,
          nowPlaying,
          loginPopover,
        )
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const Panel = createPanel(ctx)
        ctx.effect(() => bindLocale(ctx), 'qqmusic: dictionaries')
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'qqmusic', order: 30, label: () => t('panel.label') },
            PanelIcon,
          ),
        )
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'qqmusic' }, Panel))
      },
    }
  },
})
