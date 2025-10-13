@echo off
setlocal enabledelayedexpansion

echo Starting sprite upscaling process...
echo.

set "MODEL_NAME=digital-art-4x"
::set "MODEL_NAME=upscayl-standard-4x"

set "SCALE=4"
set "SCALE_FOLDER=128x"

:: `work` or `test` mode
set "MODE=test"
set "INPUT_DIR=C:\projects\x-scale-dungeon-crawl-sprite\sprites\%MODE%\original"
set "OUTPUT_BASE=C:\projects\x-scale-dungeon-crawl-sprite\sprites\%MODE%\%MODEL_NAME%\%SCALE_FOLDER%"

set "UPSCALE_BIN=C:\Program Files\Upscayl\resources\bin\upscayl-bin.exe"
set "MODELS_DIR=C:\Program Files\Upscayl\resources\models"

set "FORMAT=webp"
set "COMPRESS=0"

:: Create output base directory if it doesn't exist
if not exist "%OUTPUT_BASE%" mkdir "%OUTPUT_BASE%"

:: Process each subdirectory
for /d %%d in ("%INPUT_DIR%\*") do (
    set "SUBDIR=%%~nxd"
    set "INPUT_SUBDIR=%%d"
    set "OUTPUT_SUBDIR=%OUTPUT_BASE%\!SUBDIR!"
    set "INPUT_SUBDIR_UNIX=!INPUT_SUBDIR:\=/!"
    set "OUTPUT_SUBDIR_UNIX=!OUTPUT_SUBDIR:\=/!"
    
    echo Processing folder: "!SUBDIR!"
    echo   Input:  !INPUT_SUBDIR_UNIX!
    echo   Output: !OUTPUT_SUBDIR_UNIX!
    
    if not exist "!OUTPUT_SUBDIR!" mkdir "!OUTPUT_SUBDIR!"
    
    "%UPSCALE_BIN%" -i "!INPUT_SUBDIR_UNIX!" -o "!OUTPUT_SUBDIR_UNIX!" -m "%MODELS_DIR%" -n "%MODEL_NAME%" -s %SCALE% -f %FORMAT% -c %COMPRESS%

    if !errorlevel! equ 0 (
        echo   SUCCESS: Folder !SUBDIR! processed
    ) else (
        echo   ERROR: Failed to process folder !SUBDIR!
    )
    echo.
)

echo.
echo Sprite upscaling process completed!
::pause
