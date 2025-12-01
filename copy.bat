REM Create release directory regardless of build result
echo Creating release directory...
mkdir release 2>nul

REM Copy APK file regardless of build result
echo Copying APK file...
if exist .\src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk (
    copy .\src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk .\release\zher-app-arm64-v8a-release.apk
    echo APK file copied successfully!
) else (
    echo APK file not found!
)

echo Build process completed!
dir release