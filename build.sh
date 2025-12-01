#!/bin/bash

# 执行构建命令
echo "正在构建Android应用..."
npm run build

# 创建release目录
echo "创建release目录..."
mkdir -p release

# 复制APK文件
echo "复制APK文件到release目录..."
cp ./src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk ./release/zher-app-arm64-v8a-release.apk

echo "构建完成！APK文件已保存到release目录。"