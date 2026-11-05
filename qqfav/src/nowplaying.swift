import Foundation

typealias GetInfoFn = @convention(c) (DispatchQueue, @escaping ([String: Any]) -> Void) -> Void
typealias IsPlayingFn = @convention(c) (DispatchQueue, @escaping (Bool) -> Void) -> Void

let path = "/System/Library/PrivateFrameworks/MediaRemote.framework"
guard let bundle = CFBundleCreate(kCFAllocatorDefault, NSURL(fileURLWithPath: path)) else {
    FileHandle.standardError.write("cannot load MediaRemote\n".data(using: .utf8)!)
    exit(2)
}

func sym<T>(_ name: String, _ type: T.Type) -> T? {
    guard let p = CFBundleGetFunctionPointerForName(bundle, name as CFString) else { return nil }
    return unsafeBitCast(p, to: type)
}

guard let getInfo = sym("MRMediaRemoteGetNowPlayingInfo", GetInfoFn.self) else {
    FileHandle.standardError.write("no MRMediaRemoteGetNowPlayingInfo\n".data(using: .utf8)!)
    exit(3)
}

let sem = DispatchSemaphore(value: 0)
var payload: [String: Any] = [:]
var playing: Bool? = nil

if let isPlaying = sym("MRMediaRemoteGetNowPlayingApplicationIsPlaying", IsPlayingFn.self) {
    isPlaying(DispatchQueue.global()) { v in playing = v; sem.signal() }
    _ = sem.wait(timeout: .now() + 3)
}

getInfo(DispatchQueue.global()) { info in
    payload = info
    sem.signal()
}
_ = sem.wait(timeout: .now() + 3)

var out: [String: Any] = [:]
if let t = payload["kMRMediaRemoteNowPlayingInfoTitle"] as? String { out["title"] = t }
if let a = payload["kMRMediaRemoteNowPlayingInfoArtist"] as? String { out["artist"] = a }
if let al = payload["kMRMediaRemoteNowPlayingInfoAlbum"] as? String { out["album"] = al }
if let d = payload["kMRMediaRemoteNowPlayingInfoDuration"] as? Double { out["duration"] = d }
if let p = playing { out["playing"] = p }
out["fields"] = payload.count

if let data = try? JSONSerialization.data(withJSONObject: out, options: [.prettyPrinted, .sortedKeys]),
   let s = String(data: data, encoding: .utf8) {
    print(s)
}
