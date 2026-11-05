#!/bin/sh
# 功能一：一键收藏「当前播放」，供快捷键 / Raycast / Automator 调用
exec "$(cd "$(dirname "$0")" && pwd)/bin/qqfav" now --notify
