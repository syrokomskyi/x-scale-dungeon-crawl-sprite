@echo off
setlocal enabledelayedexpansion

echo Starting sprite upscaling process...
echo.

set "INPUT_DIR=C:\projects\x-scale-dungeon-crawl-sprite\sprites\test\original"
set "OUTPUT_BASE=C:\projects\x-scale-dungeon-crawl-sprite\sprites\test\digital-art-4x\128x"
set "UPSCALE_BIN=C:\Program Files\Upscayl\resources\bin\upscayl-bin.exe"
set "MODELS_DIR=C:\Program Files\Upscayl\resources\models"
set "MODEL_NAME=digital-art-4x"
set "SCALE=4"

:: Create output base directory if it doesn't exist
if not exist "%OUTPUT_BASE%" mkdir "%OUTPUT_BASE%"

for /r "%INPUT_DIR%" %%f in (*.png) do (
    echo Processing file: "%%f"

    :: Get directory path of the file
    set "FILE_DIR=%%~dpf"
    
    :: Remove INPUT_DIR from FILE_DIR to get relative directory
    set "REL_DIR=!FILE_DIR:%INPUT_DIR%\=!"
    
    :: Remove trailing backslash if present
    if "!REL_DIR:~-1!" EQU "\" set "REL_DIR=!REL_DIR:~0,-1!"

    set "OUTPUT_DIR=%OUTPUT_BASE%\!REL_DIR!"
    set "OUTPUT_FILE=!OUTPUT_DIR!\%%~nxf"
    set "OUTPUT_FILE_UNIX=!OUTPUT_FILE:\=/!"

    if not exist "!OUTPUT_DIR!" (
        echo   Creating directory: !OUTPUT_DIR!
        mkdir "!OUTPUT_DIR!"
    )

    echo   Upscaling to: !OUTPUT_FILE_UNIX!
    "%UPSCALE_BIN%" -i "%%f" -o "!OUTPUT_FILE_UNIX!" -m "%MODELS_DIR%" -n "%MODEL_NAME%" -s %SCALE%

    if !errorlevel! equ 0 (
        echo   SUCCESS: %%~nxf
    ) else (
        echo   ERROR: Failed to process %%~nxf
    )
    echo.
)

echo.
echo Sprite upscaling process completed!
pause
