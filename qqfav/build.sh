#!/bin/sh
# 重新编译 MediaRemote 读取器 qqfav/bin/nowplaying（需要 Xcode 命令行工具）。
# 插件与 qqfav CLI 都用这一个二进制；预编译版已随仓库分发，只有改了 Swift 源码才需要重跑。
set -eu
cd "$(dirname "$0")"
swiftc -O src/nowplaying.swift -o bin/nowplaying
echo "built $PWD/bin/nowplaying"
