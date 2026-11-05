/**
 * QQ Music host half.
 *
 * Everything the panel shows goes through this file: the macOS QQ Music
 * client's login state (or a pasted cookie), the internal QQ Music web RPC
 * (`u.y.qq.com/cgi-bin/musicu.fcg`), playback keys, lyrics, and the quarterly
 * "favorite what is playing" flow that mirrors the qqfav CLI.
 *
 * The token never leaves this process: the Client only receives masked account
 * data and audio URLs through the same-origin `/qqmusic/api` surface.
 */
import { execFile, spawn } from 'node:child_process'
import { randomInt } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'
import https from 'node:https'

const API_PREFIX = '/qqmusic/api'
const ENDPOINT = 'https://u.y.qq.com/cgi-bin/musicu.fcg'
const LYRIC_ENDPOINT = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'
const REFERER = 'https://y.qq.com/'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const QMCONF = join(homedir(), 'Library/Preferences/com.tencent.QQMusicMac.plist')
const COOKIE_FILES = [
  join(homedir(), '.config/qqfav/cookie.txt'),
  join(homedir(), '.config/qqmusic/cookie.txt'),
]

const M_SEARCH = 'music.search.SearchCgiService'
const M_READ = 'music.musicasset.PlaylistBaseRead'
const M_BASE = 'music.musicasset.PlaylistBaseWrite'
const M_DETAIL = 'music.musicasset.PlaylistDetailWrite'
const M_DISS = 'music.srfDissInfo.DissInfo'
const M_SONG = 'music.pf_song_detail_svr'
const M_VKEY = 'vkey.GetVkeyServer'

const QUALITIES = {
  standard: { prefix: 'C400', ext: 'm4a', badge: '128k', rank: 0 },
  high: { prefix: 'M800', ext: 'mp3', badge: '320k', rank: 1 },
  lossless: { prefix: 'A000', ext: 'flac', badge: 'FLAC', rank: 2 },
  hires: { prefix: 'F000', ext: 'flac', badge: 'Hi-Res', rank: 3 },
}
const QUALITY_FALLBACK = {
  standard: ['standard'],
  high: ['high', 'standard'],
  // QQ sometimes answers with an A000 purl whose file 404s while the F000
  // (Hi-Res) copy is the one actually served, so try both before 320k.
  lossless: ['lossless', 'hires', 'high', 'standard'],
}

function normalizeQuality(value) {
  return Object.prototype.hasOwnProperty.call(QUALITIES, value) ? value : 'standard'
}

const CONFIG_DEFAULTS = {
  cookie: '',
  playlist: '',
  nowPlayingBin: '',
}

export const inject = ['webServer']

/* ================================================================== */
/* errors                                                              */
/* ================================================================== */

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

function httpError(status, message, extra) {
  return new HttpError(status, message, extra)
}

/* ================================================================== */
/* tiny XML plist reader (for the QQ Music client's keyed archive)      */
/* ================================================================== */

function decodeEntities(text) {
  return String(text).replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (whole, body) => {
    if (body === 'amp') return '&'
    if (body === 'lt') return '<'
    if (body === 'gt') return '>'
    if (body === 'quot') return '"'
    if (body === 'apos') return "'"
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return whole
  })
}

function tokenizePlist(xml) {
  const tokens = []
  const re = /<(\/?)([A-Za-z0-9_$]+)[^>]*?(\/?)>/g
  let last = 0
  let match
  while ((match = re.exec(xml)) !== null) {
    const between = xml.slice(last, match.index)
    if (between.trim()) tokens.push({ kind: 'text', text: between })
    const closing = match[1] === '/'
    const selfClosing = match[3] === '/'
    tokens.push({ kind: closing ? 'close' : selfClosing ? 'self' : 'open', name: match[2] })
    last = re.lastIndex
  }
  return tokens
}

function parsePlistXml(xml) {
  const tokens = tokenizePlist(String(xml))
  let pos = 0

  function skipText() {
    while (tokens[pos] && tokens[pos].kind === 'text') pos += 1
  }

  function readBody() {
    let text = ''
    while (tokens[pos] && tokens[pos].kind === 'text') {
      text += tokens[pos].text
      pos += 1
    }
    if (tokens[pos] && tokens[pos].kind === 'close') pos += 1
    return text
  }

  function value() {
    skipText()
    const token = tokens[pos]
    if (!token || token.kind === 'close') return null
    if (token.kind === 'self') {
      pos += 1
      if (token.name === 'true') return true
      if (token.name === 'false') return false
      return null
    }
    pos += 1
    switch (token.name) {
      case 'plist': {
        const inner = value()
        skipText()
        if (tokens[pos] && tokens[pos].kind === 'close') pos += 1
        return inner
      }
      case 'dict': {
        const out = {}
        let key = null
        while (true) {
          skipText()
          const current = tokens[pos]
          if (!current || current.kind === 'close') {
            pos += 1
            break
          }
          if (current.kind === 'open' && current.name === 'key') {
            pos += 1
            key = decodeEntities(readBody())
          } else {
            const item = value()
            if (key !== null) out[key] = item
            key = null
          }
        }
        const keys = Object.keys(out)
        if (keys.length === 1 && keys[0] === 'CF$UID') {
          return { __uid: Number(out['CF$UID']) }
        }
        return out
      }
      case 'array': {
        const out = []
        while (true) {
          skipText()
          const current = tokens[pos]
          if (!current || current.kind === 'close') {
            pos += 1
            break
          }
          out.push(value())
        }
        return out
      }
      case 'string':
        return decodeEntities(readBody())
      case 'integer':
        return Number(readBody().trim())
      case 'real':
        return Number(readBody().trim())
      case 'date':
        return readBody().trim()
      case 'data':
        return Buffer.from(readBody().replace(/\s+/g, ''), 'base64')
      default:
        return decodeEntities(readBody())
    }
  }

  return value()
}

function uidDeref(objects, value) {
  let current = value
  const seen = new Set()
  while (
    current &&
    typeof current === 'object' &&
    !Array.isArray(current) &&
    !Buffer.isBuffer(current) &&
    typeof current.__uid === 'number'
  ) {
    if (seen.has(current.__uid)) return null
    seen.add(current.__uid)
    current = objects[current.__uid]
  }
  return current
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { timeout: 10000, maxBuffer: 8 * 1024 * 1024, windowsHide: true, ...options },
      (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout
          error.stderr = stderr
          reject(error)
          return
        }
        resolve({ stdout, stderr })
      },
    )
  })
}

function runWithInput(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true })
    const out = []
    const err = []
    let size = 0
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('plutil 超时'))
    }, 10000)
    child.stdout.on('data', (chunk) => {
      size += chunk.length
      if (size > 8 * 1024 * 1024) {
        child.kill()
        reject(new Error('plist 过大'))
        return
      }
      out.push(chunk)
    })
    child.stderr.on('data', (chunk) => err.push(chunk))
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(Buffer.concat(err).toString('utf8') || `plutil 退出码 ${code}`))
        return
      }
      resolve(Buffer.concat(out))
    })
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

async function readClientAccounts() {
  let xml
  try {
    const plutil = process.platform === 'darwin' ? '/usr/bin/plutil' : 'plutil'
    const { stdout } = await run(plutil, ['-convert', 'xml1', '-o', '-', QMCONF])
    xml = stdout
  } catch {
    return []
  }
  let outer
  try {
    outer = parsePlistXml(xml)
  } catch {
    return []
  }
  const blob = outer && outer.AutoLoginUserInfo
  if (!Buffer.isBuffer(blob) || blob.length === 0) return []
  let innerXml
  try {
    const plutil = process.platform === 'darwin' ? '/usr/bin/plutil' : 'plutil'
    // AutoLoginUserInfo is a binary NSKeyedArchiver blob; let plutil decode it.
    innerXml = (await runWithInput(plutil, ['-convert', 'xml1', '-o', '-', '-'], blob)).toString('utf8')
  } catch {
    return []
  }
  let archive
  try {
    archive = parsePlistXml(innerXml)
  } catch {
    return []
  }
  if (!archive || !Array.isArray(archive.$objects)) return []
  const objects = archive.$objects
  const root = uidDeref(objects, archive.$top && archive.$top.root)
  const users = uidDeref(objects, root && root.userArray)
  const list = users && Array.isArray(users['NS.objects']) ? users['NS.objects'] : []
  const accounts = []
  for (const item of list) {
    const record = uidDeref(objects, item)
    if (!record || typeof record !== 'object') continue
    const uin = uidDeref(objects, record.nUserId)
    const key = uidDeref(objects, record.strAuthst)
    const numeric = Number(uin)
    if (Number.isFinite(numeric) && numeric > 0 && typeof key === 'string' && key.length > 0) {
      accounts.push({ uin: numeric, key })
    }
  }
  return accounts
}

/* ================================================================== */
/* auth                                                                */
/* ================================================================== */

function parseCookie(raw) {
  const jar = {}
  for (const part of String(raw || '').replace(/;\s*/g, ';').split(';')) {
    const at = part.indexOf('=')
    if (at <= 0) continue
    jar[part.slice(0, at).trim()] = part.slice(at + 1).trim()
  }
  const key = jar.qm_keyst || jar.qqmusic_key || jar.musickey || jar.music_key
  const uin = String(jar.uin || jar.qqmusic_uin || jar.wxuin || '').replace(/\D/g, '')
  if (!key || !uin) return null
  return { uin: Number(uin), key }
}

let authCache = { at: 0, value: null }
let authOverride = null

async function loadAuth(config) {
  const now = Date.now()
  if (!authOverride && authCache.value && now - authCache.at < 15000) return authCache.value

  const sources = []
  if (authOverride) sources.push({ raw: authOverride, source: 'panel' })
  if (config.cookie) sources.push({ raw: config.cookie, source: 'config' })
  if (process.env.QQFAV_COOKIE) sources.push({ raw: process.env.QQFAV_COOKIE, source: 'env' })
  for (const file of COOKIE_FILES) {
    try {
      sources.push({ raw: await readFile(file, 'utf8'), source: 'file' })
    } catch {
      // missing cookie file is normal
    }
  }
  for (const candidate of sources) {
    const parsed = parseCookie(candidate.raw)
    if (!parsed) continue
    const value = { ...parsed, source: candidate.source }
    if (!authOverride) authCache = { at: now, value }
    return value
  }

  const accounts = await readClientAccounts()
  if (accounts.length > 0) {
    const value = { ...accounts[0], source: 'client' }
    if (!authOverride) authCache = { at: now, value }
    return value
  }

  throw httpError(
    401,
    '没有读到 QQ 音乐登录态：请先登录 macOS 版 QQ 音乐客户端，或在插件配置里填写 cookie',
    { login: true },
  )
}

function maskUin(uin) {
  const text = String(uin)
  if (text.length <= 5) return text
  return `${text.slice(0, 3)}***${text.slice(-3)}`
}

/* ================================================================== */
/* QQ Music RPC                                                        */
/* ================================================================== */

function hash33(text, seed = 5381) {
  let hash = seed
  for (const char of String(text)) hash = (hash << 5) + hash + char.codePointAt(0)
  return hash & 2147483647
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[（(].*?[)）]/g, '')
    .replace(/[\s\-_·・,，.。!！?？'"“”‘’]+/g, '')
}

function artistNames(singer) {
  if (!Array.isArray(singer)) return ''
  return singer
    .map((item) => (item && (item.name || item.title)) || '')
    .filter(Boolean)
    .join('/')
}

function mapSearchSong(song) {
  return {
    mid: song.mid || '',
    id: Number(song.id) || 0,
    title: song.title || song.name || '',
    subtitle: song.subtitle || '',
    artist: artistNames(song.singer),
    album: (song.album && song.album.name) || '',
    albumMid: (song.album && song.album.mid) || '',
    interval: Number(song.interval) || 0,
    type: Number(song.type) || 0,
    mediaMid: (song.file && song.file.media_mid) || song.mid || '',
  }
}

function mapDissSong(song) {
  return {
    mid: song.mid || '',
    id: Number(song.id) || 0,
    title: song.title || song.name || '',
    subtitle: song.subtitle || '',
    artist: artistNames(song.singer),
    album: (song.album && (song.album.name || song.album.title)) || '',
    albumMid: (song.album && song.album.mid) || '',
    interval: Number(song.interval) || 0,
    type: Number(song.type) || 0,
    mediaMid: (song.file && song.file.media_mid) || song.mid || '',
  }
}

function mapPlaylist(item) {
  return {
    dirId: Number(item.dirId) || 0,
    tid: Number(item.tid) || 0,
    name: item.dirName || '',
    songNum: Number(item.songNum != null ? item.songNum : item.songCnt) || 0,
    picUrl: item.picUrl || item.bigpicUrl || '',
    isDefault: Number(item.dirId) === 201,
  }
}

function probeAudio(url) {
  return new Promise((resolve) => {
    let target
    try {
      target = new URL(url)
    } catch {
      resolve(false)
      return
    }
    const lib = target.protocol === 'https:' ? https : http
    const request = lib.request(
      target,
      { method: 'GET', headers: { 'user-agent': UA, referer: REFERER, range: 'bytes=0-1' } },
      (response) => {
        const ok = response.statusCode === 200 || response.statusCode === 206
        response.destroy()
        resolve(ok)
      },
    )
    request.setTimeout(8000, () => {
      request.destroy()
      resolve(false)
    })
    request.on('error', () => resolve(false))
    request.end()
  })
}

class QQApi {
  constructor(auth) {
    this.uin = Number(auth.uin)
    this.key = auth.key
    this.gtk = hash33(this.key)
    this.guid = String(randomInt(1000000000, 9999999999))
    this.urlCache = new Map()
    this.detailCache = new Map()
  }

  comm() {
    return {
      ct: '24',
      cv: '4747474',
      platform: 'yqq.json',
      chid: '0',
      uin: String(this.uin),
      g_tk: String(this.gtk),
      g_tk_new_20200303: String(this.gtk),
      format: 'json',
      inCharset: 'utf-8',
      outCharset: 'utf-8',
      notice: '0',
      need_new_code: '1',
    }
  }

  async call(module, method, param) {
    const body = JSON.stringify({
      comm: this.comm(),
      req: { module, method, param },
    })
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    let response
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          referer: REFERER,
          'user-agent': UA,
          cookie: `uin=o0${this.uin}; qm_keyst=${this.key}`,
        },
        body,
      })
    } catch (error) {
      throw httpError(502, `连接 QQ 音乐失败：${error && error.message ? error.message : error}`)
    } finally {
      clearTimeout(timer)
    }
    if (!response.ok) throw httpError(502, `QQ 音乐返回 HTTP ${response.status}（${module}/${method}）`)
    let payload
    try {
      payload = await response.json()
    } catch {
      throw httpError(502, 'QQ 音乐返回了无法解析的内容')
    }
    if (!payload || payload.code !== 0) {
      throw httpError(502, `QQ 音乐接口错误 code=${payload && payload.code}（${module}/${method}）`)
    }
    const inner = payload.req || {}
    const code = inner.code
    if (code === 1000 || code === 301) {
      throw httpError(401, '登录态失效：请重新登录 QQ 音乐客户端，或更新 cookie', { login: true })
    }
    if (code !== 0) {
      const hint =
        code === 80105
          ? '写入被服务端拒绝（业务码 80105）'
          : code === -1000
            ? '请求被拒绝'
            : 'QQ 音乐业务错误'
      throw httpError(502, `${hint} code=${code}（${module}/${method}）`)
    }
    const data = inner.data || {}
    if (data.retCode != null && data.retCode !== 0) {
      throw httpError(502, `retCode=${data.retCode}（${module}/${method}）`)
    }
    return data
  }

  async search(query, limit = 20) {
    const data = await this.call(M_SEARCH, 'DoSearchForQQMusicDesktop', {
      query,
      num_per_page: Math.min(Math.max(limit, 1), 50),
      page_num: 1,
      search_type: 0,
    })
    const list = (data.body && data.body.song && data.body.song.list) || []
    return list.map(mapSearchSong)
  }

  async playlists() {
    const data = await this.call(M_READ, 'GetPlaylistByUin', { uin: String(this.uin) })
    return (data.v_playlist || []).map(mapPlaylist)
  }

  async playlistSongs(dirId, tid) {
    const songs = []
    let begin = 0
    while (true) {
      const data = await this.call(M_DISS, 'CgiGetDiss', {
        disstid: tid,
        dirid: dirId,
        tag: true,
        song_begin: begin,
        song_num: 300,
        userinfo: true,
        orderlist: true,
      })
      const batch = data.songlist || []
      songs.push(...batch.map(mapDissSong))
      begin += batch.length
      const total = Number(data.total_song_num) || 0
      if (batch.length === 0 || !data.hasmore || begin >= total) break
    }
    return songs
  }

  async createPlaylist(name) {
    const data = await this.call(M_BASE, 'AddPlaylist', {
      dirName: name,
      dirDesc: '',
      dirPicUrl: '',
      taglist: '',
      dirShow: 2,
    })
    const result = data.result || {}
    if (!result.dirId) {
      throw httpError(502, '创建歌单失败：接口没有返回 dirId')
    }
    return { dirId: Number(result.dirId), tid: Number(result.tid) || 0, name, songNum: 0, picUrl: '' }
  }

  async addSongs(dirId, tid, songs) {
    await this.call(M_DETAIL, 'AddSonglist', {
      dirId,
      tid,
      bFmtUtf8: true,
      v_songInfo: songs.map((song) => ({ songId: song.id, songType: song.type || 0 })),
    })
  }

  async songByMid(mid) {
    const cached = this.detailCache.get(mid)
    if (cached && cached.expires > Date.now()) return cached.value
    const data = await this.call(M_SONG, 'get_song_detail', { song_mid: mid })
    const info = data.track_info || {}
    if (!info || !info.id) throw httpError(404, '找不到这首歌')
    const value = {
      mid: info.mid || mid,
      id: Number(info.id) || 0,
      title: info.name || info.title || '',
      subtitle: info.subtitle || '',
      artist: artistNames(info.singer),
      album: (info.album && (info.album.name || info.album.title)) || '',
      albumMid: (info.album && info.album.mid) || '',
      interval: Number(info.interval) || 0,
      type: Number(info.type) || 0,
      mediaMid: (info.file && info.file.media_mid) || info.mid || mid,
    }
    this.detailCache.set(mid, { value, expires: Date.now() + 5 * 60 * 1000 })
    return value
  }

  async mediaMidOf(mid) {
    try {
      const track = await this.songByMid(mid)
      return track.mediaMid || track.mid || mid
    } catch {
      return mid
    }
  }

  async searchTop(text, limit = 8) {
    const songs = await this.search(text, limit)
    if (songs.length === 0) throw httpError(404, `搜不到这首歌：${text}`)
    const tokens = String(text).trim().split(/\s+/).filter(Boolean)
    const wants = new Set([normalize(text)])
    if (tokens[0]) wants.add(normalize(tokens[0]))
    const best =
      songs.find((song) => wants.has(normalize(song.title))) ||
      songs[0]
    return best
  }

  async playUrl(mid, quality = 'standard', mediaMid = '', refresh = false) {
    const wanted = normalizeQuality(quality)
    const key = `${mid}:${wanted}`
    const cached = this.urlCache.get(key)
    if (!refresh && cached && cached.expires > Date.now()) return cached
    const media = mediaMid || (await this.mediaMidOf(mid))
    let lastError = null
    for (const level of QUALITY_FALLBACK[wanted]) {
      const spec = QUALITIES[level]
      const filename = `${spec.prefix}${media}.${spec.ext}`
      let data
      try {
        data = await this.call(M_VKEY, 'CgiGetVkey', {
          guid: this.guid,
          songmid: [mid],
          songtype: [0],
          uin: String(this.uin),
          loginflag: 1,
          platform: '20',
          filename: [filename],
        })
      } catch (error) {
        lastError = error
        continue
      }
      const info = (data.midurlinfo || [])[0] || {}
      const purl = info.purl
      if (!purl) {
        lastError = httpError(404, `这首歌暂时没有${spec.badge}音质的地址`)
        continue
      }
      const base =
        (data.sip || []).find((item) => typeof item === 'string' && item) ||
        'https://dl.stream.qqmusic.qq.com/'
      const url = purl.startsWith('http') ? purl : `${base.replace(/\/+$/, '')}/${purl.replace(/^\/+/, '')}`
      if (!(await probeAudio(url))) {
        // QQ answers with a purl even when the file is not actually available.
        lastError = httpError(404, `这首歌暂时没有${spec.badge}音质的地址`)
        continue
      }
      const value = {
        url,
        requested: wanted,
        quality: level,
        badge: spec.badge,
        expires: Date.now() + 8 * 60 * 1000,
      }
      this.urlCache.set(key, value)
      return value
    }
    if (lastError && lastError.status === 401) throw lastError
    throw httpError(404, '这首歌暂时没有可播放地址，可能需要会员或已下架')
  }

  invalidateUrl(mid, quality = 'standard') {
    this.urlCache.delete(`${mid}:${normalizeQuality(quality)}`)
  }

  async lyric(mid) {
    const params = new URLSearchParams({
      songmid: mid,
      format: 'json',
      nobase64: '1',
      g_tk: '5381',
      loginUin: String(this.uin),
      hostUin: '0',
      inCharset: 'utf8',
      outCharset: 'utf-8',
      notice: '0',
      platform: 'yqq.json',
      needNewCode: '0',
    })
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    let response
    try {
      response = await fetch(`${LYRIC_ENDPOINT}?${params}`, {
        signal: controller.signal,
        headers: {
          referer: REFERER,
          'user-agent': UA,
          cookie: `uin=o0${this.uin}; qm_keyst=${this.key}`,
        },
      })
    } catch (error) {
      throw httpError(502, `歌词请求失败：${error && error.message ? error.message : error}`)
    } finally {
      clearTimeout(timer)
    }
    if (!response.ok) throw httpError(502, `歌词接口 HTTP ${response.status}`)
    let payload
    try {
      payload = await response.json()
    } catch {
      throw httpError(502, '歌词接口返回了无法解析的内容')
    }
    if (payload.retcode !== 0 && payload.code !== 0) {
      throw httpError(502, `歌词接口错误 retcode=${payload.retcode}`)
    }
    return { lyric: payload.lyric || '', trans: payload.trans || '' }
  }
}

/**
 * One QQApi per account for the whole Host process, so vkey / song-detail
 * caches survive across HTTP requests (a range request is a new request).
 */
let sharedApi = null
let sharedApiKey = ''

function getApi(auth) {
  const key = `${auth.uin}:${auth.key}`
  if (!sharedApi || sharedApiKey !== key) {
    sharedApi = new QQApi(auth)
    sharedApiKey = key
  }
  return sharedApi
}

/* ================================================================== */
/* now playing                                                         */
/* ================================================================== */

function expandHome(path) {
  if (!path) return ''
  if (path === '~') return homedir()
  if (path.startsWith('~/')) return join(homedir(), path.slice(2))
  return path
}

async function systemNowPlaying(config) {
  const candidates = [
    process.env.QQFAV_NOWPLAYING,
    config.nowPlayingBin ? expandHome(config.nowPlayingBin) : '',
    join(homedir(), 'myprojects/qqfav/bin/nowplaying'),
    join(homedir(), 'bin/nowplaying'),
    '/usr/local/bin/nowplaying',
    '/opt/homebrew/bin/nowplaying',
  ].filter(Boolean)
  for (const binary of candidates) {
    let parsed
    try {
      const { stdout } = await run(binary, [], { timeout: 5000 })
      parsed = JSON.parse(stdout || '{}')
    } catch {
      continue
    }
    if (parsed && parsed.title) {
      return {
        title: String(parsed.title),
        artist: String(parsed.artist || ''),
        playing: parsed.playing !== false,
        source: 'system',
      }
    }
    if (parsed && 'playing' in parsed) return null
  }
  return null
}

/* ================================================================== */
/* quarterly playlist                                                  */
/* ================================================================== */

function quarterName(date = new Date()) {
  const month = date.getMonth() + 1
  return `${date.getFullYear()}Q${Math.floor((month - 1) / 3) + 1}`
}

function shanghaiDay(ms) {
  return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

function findDailyCard(feed) {
  for (const shelf of (feed && feed.v_shelf) || []) {
    for (const niche of shelf.v_niche || []) {
      for (const card of niche.v_card || []) {
        if (Number(card.subtype) === 510 && card.id) return card
      }
    }
  }
  return null
}

function mapSquarePlaylist(item) {
  const basic = item && item.Playlist && item.Playlist.basic
  if (!basic || !basic.tid) return null
  const cover = basic.cover || {}
  return {
    dirId: Number(basic.dirid) || 0,
    tid: Number(basic.tid) || 0,
    name: basic.title || '',
    desc: basic.desc || '',
    creator: (basic.creator && basic.creator.nick) || '',
    songNum: Number(basic.song_cnt) || 0,
    playCount: Number(basic.play_cnt) || 0,
    cover: cover.medium_url || cover.small_url || cover.default_url || '',
    isPublic: true,
  }
}

async function collectRadio(api, limit = 16, exclude) {
  // id=99 is QQ Music's "猜你喜欢" channel; an empty request falls back to a
  // themed radio ("睡前"), so these params are required. The server advances a
  // per-session cursor on each call and returns 5 songs, so calls are serial:
  // firing them in parallel just repeats the same five songs.
  const skip = exclude instanceof Set ? exclude : new Set(exclude || [])
  const seen = new Set(skip)
  const songs = []
  const calls = Math.min(Math.ceil((limit + (skip.size > 0 ? 5 : 0)) / 5), 8)
  let name = '猜你喜欢'
  for (let round = 0; round < calls && songs.length < limit; round += 1) {
    let data
    try {
      data = await api.call('music.radioProxy.MbTrackRadioSvr', 'get_radio_track', {
        id: 99,
        num: 5,
        from: 0,
        scene: 0,
        song_ids: [],
      })
    } catch {
      continue
    }
    if (data.name) name = String(data.name)
    for (const track of data.tracks || []) {
      if (!track || !track.mid || seen.has(track.mid)) continue
      seen.add(track.mid)
      songs.push(mapDissSong(track))
      if (songs.length >= limit) break
    }
  }
  return { name, songs }
}

async function buildHome(api) {
  const [feedResult, squareResult, radioResult] = await Promise.allSettled([
    api.call('music.recommend.RecommendFeed', 'get_recommend_feed', {
      direction: 0,
      page: 1,
      v_cache: [],
      v_uniq: [],
      s_num: 0,
    }),
    api.call('music.playlist.PlaylistSquare', 'GetRecommendFeed', { From: 0, Size: 12 }),
    collectRadio(api, 16),
  ])
  if (feedResult.status === 'rejected' && feedResult.reason && feedResult.reason.status === 401) {
    throw feedResult.reason
  }

  const today = shanghaiDay(Date.now())
  let daily = null
  let dailyNote = ''
  if (feedResult.status === 'fulfilled') {
    const card = findDailyCard(feedResult.value)
    if (!card) {
      dailyNote = '推荐流里没有找到每日30首'
    } else if (shanghaiDay(Number(card.time) * 1000) !== today) {
      dailyNote = '今日推荐还没有更新'
    } else {
      try {
        const data = await api.call(M_DISS, 'CgiGetDiss', {
          disstid: Number(card.id),
          dirid: 0,
          song_begin: 0,
          song_num: 300,
          userinfo: true,
          orderlist: true,
          tag: true,
        })
        const info = data.dirinfo || {}
        daily = {
          title: '每日30首',
          date: today,
          playlistId: String(card.id),
          dirId: Number(info.dirid) || 0,
          desc: info.desc || '',
          cover: info.picurl || card.cover || '',
          songs: (data.songlist || []).map(mapDissSong),
        }
      } catch (error) {
        dailyNote = error.message
      }
    }
  } else {
    dailyNote = feedResult.reason ? feedResult.reason.message : '推荐接口不可用'
  }

  return {
    ok: true,
    date: today,
    daily,
    dailyNote,
    playlists:
      squareResult.status === 'fulfilled'
        ? (squareResult.value.List || []).map(mapSquarePlaylist).filter(Boolean)
        : [],
    radio: radioResult.status === 'fulfilled' ? radioResult.value : { name: '', songs: [] },
    generatedAt: Date.now(),
  }
}

async function ensurePlaylist(api, name) {
  const playlists = await api.playlists()
  const hit = playlists.find((item) => item.name === name)
  if (hit) return hit
  const created = await api.createPlaylist(name)
  if (created.tid) return created
  const again = await api.playlists()
  const found = again.find((item) => item.name === name)
  if (!found) throw httpError(502, '创建歌单后未能读回，请稍后重试')
  return found
}

async function favoriteSong(api, input, config) {
  const name = String(input.playlist || config.playlist || quarterName()).trim()
  let track
  let origin
  if (input.mid) {
    track = await api.songByMid(String(input.mid))
    origin = 'mid'
  } else if (input.text) {
    track = await api.searchTop(String(input.text))
    origin = 'search'
  } else if (input.system) {
    const now = await systemNowPlaying(config)
    if (!now) {
      throw httpError(
        422,
        '读不到系统「正在播放」：请先在 QQ 音乐客户端里播放，或改用搜索/歌曲 mid 收藏',
        { noNowPlaying: true },
      )
    }
    track = await api.searchTop(`${now.title} ${now.artist}`.trim())
    origin = 'system'
  } else {
    throw httpError(400, '缺少要收藏的歌曲')
  }
  if (!track || !track.id) throw httpError(422, '拿不到歌曲数字 ID，无法写入歌单')

  const playlist = await ensurePlaylist(api, name)
  const existing = await api.playlistSongs(playlist.dirId, playlist.tid)
  const already = existing.some((song) => song.id === track.id)

  if (already) {
    return {
      ok: true,
      added: false,
      duplicate: true,
      origin,
      track,
      playlist: { ...playlist, songNum: existing.length },
      count: existing.length,
    }
  }

  await api.addSongs(playlist.dirId, playlist.tid, [track])
  const after = await api.playlistSongs(playlist.dirId, playlist.tid)
  if (!after.some((song) => song.id === track.id)) {
    throw httpError(502, '写入后读回未发现该歌曲，可能未生效')
  }
  return {
    ok: true,
    added: true,
    duplicate: false,
    origin,
    track,
    playlist: { ...playlist, songNum: after.length },
    count: after.length,
  }
}

/* ================================================================== */
/* HTTP surface                                                        */
/* ================================================================== */

function send(res, status, payload) {
  if (res.headersSent) {
    res.end()
    return
  }
  const text = JSON.stringify(payload == null ? {} : payload)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(text)
}

function isLocal(req) {
  const address = (req.socket && req.socket.remoteAddress) || ''
  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1' ||
    address === ''
  )
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 512 * 1024) {
        reject(httpError(413, '请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(httpError(400, '请求体不是合法 JSON'))
      }
    })
    req.on('error', reject)
  })
}

function pickConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const out = { ...CONFIG_DEFAULTS }
  if (typeof source.cookie === 'string') out.cookie = source.cookie.trim()
  if (typeof source.playlist === 'string') out.playlist = source.playlist.trim()
  if (typeof source.nowPlayingBin === 'string') out.nowPlayingBin = source.nowPlayingBin.trim()
  return out
}

export function apply(ctx, rawConfig) {
  const config = pickConfig(rawConfig)

  const playlistsCache = { at: 0, value: null }
  const lyricCache = new Map()
  const homeCache = { at: 0, value: null }

  function cachedPlaylists(api, force = false) {
    if (!force && playlistsCache.value && Date.now() - playlistsCache.at < 20000) {
      return Promise.resolve(playlistsCache.value)
    }
    return api.playlists().then((value) => {
      playlistsCache.at = Date.now()
      playlistsCache.value = value
      return value
    })
  }

  async function status() {
    const auth = await loadAuth(config)
    const api = getApi(auth)
    const playlists = await api.playlists()
    const name = config.playlist || quarterName()
    const quarter = playlists.find((item) => item.name === name) || null
    const now = await systemNowPlaying(config)
    return {
      ok: true,
      login: { uin: maskUin(auth.uin), source: auth.source },
      quarter: name,
      playlist: quarter,
      playlistCount: playlists.length,
      nowPlaying: now,
      date: new Date().toISOString(),
    }
  }

  async function listPlaylists() {
    const auth = await loadAuth(config)
    const api = getApi(auth)
    const playlists = await cachedPlaylists(api, true)
    return {
      ok: true,
      quarter: config.playlist || quarterName(),
      playlists,
      count: playlists.length,
    }
  }

  async function loadPlaylist(query) {
    const auth = await loadAuth(config)
    const api = getApi(auth)
    let playlist = null
    const dirId = Number(query.get('dirId'))
    const tid = Number(query.get('tid'))
    if (dirId && tid) {
      // Public / recommended playlists are addressed directly, not by name.
      playlist = { dirId, tid, name: String(query.get('name') || '') }
    } else if (query.get('name')) {
      const name = String(query.get('name'))
      const playlists = await cachedPlaylists(api)
      playlist = playlists.find((item) => item.name === name) || null
      if (!playlist) return { ok: true, playlist: { name, exists: false }, songs: [], count: 0 }
    } else {
      throw httpError(400, '缺少歌单参数')
    }
    const songs = await api.playlistSongs(playlist.dirId, playlist.tid)
    return { ok: true, playlist: { ...playlist, exists: true, songNum: songs.length }, songs, count: songs.length }
  }

  async function search(query) {
    const text = String(query.get('q') || '').trim()
    if (!text) return { ok: true, songs: [], count: 0 }
    const auth = await loadAuth(config)
    const api = getApi(auth)
    const songs = await api.search(text, Number(query.get('limit')) || 20)
    return { ok: true, query: text, songs, count: songs.length }
  }

  async function radio(query) {
    const auth = await loadAuth(config)
    const api = getApi(auth)
    const limit = Math.min(Math.max(Number(query.get('limit')) || 16, 1), 40)
    const exclude = new Set(String(query.get('exclude') || '').split(',').filter(Boolean))
    const value = await collectRadio(api, limit, exclude)
    return { ok: true, name: value.name, songs: value.songs, count: value.songs.length }
  }

  async function lyric(query) {
    const mid = String(query.get('mid') || '')
    if (!mid) throw httpError(400, '缺少歌曲 mid')
    if (lyricCache.has(mid)) return { ok: true, ...lyricCache.get(mid) }
    const auth = await loadAuth(config)
    const api = getApi(auth)
    const value = await api.lyric(mid)
    lyricCache.set(mid, value)
    return { ok: true, ...value }
  }

  async function loadHome(force = false) {
    if (!force && homeCache.value && Date.now() - homeCache.at < 5 * 60 * 1000) return homeCache.value
    const auth = await loadAuth(config)
    const api = getApi(auth)
    const value = await buildHome(api)
    homeCache.at = Date.now()
    homeCache.value = value
    return value
  }

  async function fav(body) {
    const auth = await loadAuth(config)
    const api = getApi(auth)
    const result = await favoriteSong(api, body || {}, config)
    playlistsCache.at = 0
    return result
  }

  async function login(body) {
    const cookie = typeof (body && body.cookie) === 'string' ? body.cookie.trim() : ''
    if (!cookie) throw httpError(400, '缺少 cookie')
    const parsed = parseCookie(cookie)
    if (!parsed) throw httpError(400, 'Cookie 里没有 uin 或 qm_keyst')
    authOverride = cookie
    authCache = { at: 0, value: null }
    try {
      const api = getApi({ uin: parsed.uin, key: parsed.key })
      const playlists = await api.playlists()
      return { ok: true, login: { uin: maskUin(parsed.uin), source: 'panel' }, playlistCount: playlists.length }
    } catch (error) {
      authOverride = null
      throw error
    }
  }

  async function streamAudio(req, res, mid, quality, mediaMid) {
    if (!mid) throw httpError(400, '缺少歌曲 mid')
    const auth = await loadAuth(config)
    const api = getApi(auth)
    let retried = false

    const attempt = async () => {
      const value = await api.playUrl(mid, quality, mediaMid, retried)
      const url = value.url
      await new Promise((resolve, reject) => {
        let target
        try {
          target = new URL(url)
        } catch {
          reject(httpError(502, '无法解析播放地址'))
          return
        }
        const lib = target.protocol === 'https:' ? https : http
        const headers = { 'user-agent': UA, referer: REFERER }
        if (req.headers.range) headers.range = req.headers.range
        const upstream = lib.request(target, { method: 'GET', headers }, (upstreamRes) => {
          if (upstreamRes.statusCode === 403 && !retried) {
            retried = true
            upstreamRes.resume()
            api.invalidateUrl(mid, quality)
            attempt().then(resolve, reject)
            return
          }
          res.statusCode = upstreamRes.statusCode || 502
          for (const key of [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
            'content-encoding',
            'last-modified',
            'etag',
          ]) {
            const value = upstreamRes.headers[key]
            if (value) res.setHeader(key, value)
          }
          res.setHeader('cache-control', 'no-store')
          if (req.method === 'HEAD') {
            res.end()
            upstreamRes.destroy()
            resolve()
            return
          }
          upstreamRes.pipe(res)
          upstreamRes.on('end', resolve)
          upstreamRes.on('error', reject)
        })
        upstream.setTimeout(25000, () => upstream.destroy(new Error('上游超时')))
        upstream.on('error', reject)
        res.on('close', () => upstream.destroy())
        upstream.end()
      })
    }

    try {
      await attempt()
    } catch (error) {
      if (!res.headersSent) {
        send(res, 502, { ok: false, error: error.message || String(error) })
      } else {
        res.destroy()
      }
    }
  }

  const handler = async (req, res) => {
    if (!isLocal(req)) {
      send(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    const url = new URL(req.url || '/', 'http://localhost')
    if (!url.pathname.startsWith(API_PREFIX)) {
      send(res, 404, { ok: false, error: 'not found' })
      return
    }
    const route = url.pathname.slice(API_PREFIX.length) || '/'
    const method = req.method || 'GET'
    try {
      if (method === 'GET' && route === '/status') {
        send(res, 200, await status())
        return
      }
      if (method === 'GET' && route === '/playlists') {
        send(res, 200, await listPlaylists())
        return
      }
      if (method === 'GET' && route === '/playlist') {
        send(res, 200, await loadPlaylist(url.searchParams))
        return
      }
      if (method === 'GET' && route === '/search') {
        send(res, 200, await search(url.searchParams))
        return
      }
      if (method === 'GET' && route === '/radio') {
        send(res, 200, await radio(url.searchParams))
        return
      }
      if (method === 'GET' && route === '/lyric') {
        send(res, 200, await lyric(url.searchParams))
        return
      }
      if (method === 'GET' && route === '/nowplaying') {
        const now = await systemNowPlaying(config)
        send(res, 200, { ok: true, nowPlaying: now })
        return
      }
      if (method === 'GET' && route === '/home') {
        send(res, 200, await loadHome(url.searchParams.get('refresh') === '1'))
        return
      }
      if (method === 'GET' && route === '/songurl') {
        const mid = String(url.searchParams.get('mid') || '')
        if (!mid) throw httpError(400, '缺少歌曲 mid')
        const quality = normalizeQuality(String(url.searchParams.get('quality') || 'standard'))
        const mediaMid = String(url.searchParams.get('mediaMid') || '')
        const auth = await loadAuth(config)
        const api = getApi(auth)
        const value = await api.playUrl(mid, quality, mediaMid)
        send(res, 200, {
          ok: true,
          mid,
          url: value.url,
          quality: value.requested,
          actual: value.quality,
          badge: value.badge,
        })
        return
      }
      if ((method === 'GET' || method === 'HEAD') && route === '/audio') {
        await streamAudio(
          req,
          res,
          String(url.searchParams.get('mid') || ''),
          normalizeQuality(String(url.searchParams.get('quality') || 'standard')),
          String(url.searchParams.get('mediaMid') || ''),
        )
        return
      }
      if (method === 'POST' && route === '/fav') {
        const body = await readJson(req)
        send(res, 200, await fav(body))
        return
      }
      if (method === 'POST' && route === '/login') {
        const body = await readJson(req)
        send(res, 200, await login(body))
        return
      }
      send(res, 404, { ok: false, error: 'not found' })
    } catch (error) {
      const statusCode = error instanceof HttpError ? error.status : 500
      send(res, statusCode, {
        ok: false,
        error: error && error.message ? error.message : String(error),
        ...(error && error.extra ? error.extra : {}),
      })
    }
  }

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: API_PREFIX, handler }), 'qqmusic: api route')
}

/* ================================================================== */
/* self test: `node index.js selftest [query]`                          */
/* ================================================================== */

async function selftest() {
  const query = process.argv[3] || '晴天 周杰伦'
  const config = pickConfig({})
  const auth = await loadAuth(config)
  console.log('login', maskUin(auth.uin), 'source', auth.source, 'gtk', hash33(auth.key))
  const api = getApi(auth)
  const playlists = await api.playlists()
  console.log('playlists', playlists.length, 'quarter', quarterName())
  const quarter = playlists.find((item) => item.name === quarterName())
  console.log('quarter playlist', quarter || 'missing')
  if (quarter) {
    const songs = await api.playlistSongs(quarter.dirId, quarter.tid)
    console.log('quarter songs', songs.length, songs[0] ? songs[0].title : '')
  }
  const found = await api.search(query, 5)
  console.log('search', found.length, found[0] && found[0].title, found[0] && found[0].mid)
  if (found[0]) {
    for (const quality of ['standard', 'high', 'lossless']) {
      const value = await api.playUrl(found[0].mid, quality, found[0].mediaMid)
      console.log(`play url ${quality} -> ${value.badge}`, value.url.slice(0, 70))
    }
    const lyr = await api.lyric(found[0].mid)
    console.log('lyric chars', lyr.lyric.length)
  }
  console.log('--- home ---')
  const home = await buildHome(api)
  console.log('home date', home.date, 'note', home.dailyNote || '(none)')
  if (home.daily) {
    console.log('daily', home.daily.title, home.daily.date, home.daily.songs.length, 'cover', home.daily.cover.slice(0, 50))
    console.log('daily first', home.daily.songs[0] && home.daily.songs[0].title)
  }
  console.log('playlists', home.playlists.length, home.playlists[0] && home.playlists[0].name)
  console.log('radio', home.radio.name, home.radio.songs.length, home.radio.songs[0] && home.radio.songs[0].title)
  const more = await collectRadio(api, 16, new Set(home.radio.songs.map((song) => song.mid)))
  console.log('radio more (exclude)', more.songs.length)
  console.log('nowplaying', await systemNowPlaying(config))
}

const invokedDirectly = process.argv[1] && /qqmusic-plugin[\\/]index\.js$/.test(process.argv[1])
if (invokedDirectly && process.argv[2] === 'selftest') {
  selftest().catch((error) => {
    console.error('selftest failed:', error && error.message ? error.message : error)
    process.exitCode = 1
  })
}

