@echo off
setlocal enabledelayedexpansion

echo Starting sprite upscaling process...
echo Thanks https://github.com/upscayl/upscayl
echo.

set "MODEL_NAME=digital-art-4x"
::set "MODEL_NAME=upscayl-standard-4x"

set "SCALE=4"
set "SCALE_FOLDER=128x"

:: `work` or `test` mode
set "MODE=work"
set "INPUT_DIR=..\..\sprites\%MODE%\original"
set "OUTPUT_DIR=..\..\sprites\%MODE%\%MODEL_NAME%\%SCALE_FOLDER%"

:: Upscayl tool must be installed by this path.
:: See https://github.com/upscayl/upscayl
set "UPSCALE_BIN=C:\Program Files\Upscayl\resources\bin\upscayl-bin.exe"
set "MODELS_DIR=C:\Program Files\Upscayl\resources\models"

set "FORMAT=webp"
set "COMPRESS=0"

:: Create output base directory if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: Get absolute paths for INPUT_DIR and OUTPUT_DIR
pushd "%INPUT_DIR%"
set "INPUT_DIR_ABS=%CD%"
popd

pushd "%OUTPUT_DIR%"
set "OUTPUT_DIR_ABS=%CD%"
popd

:: Process all subdirectories recursively
for /r "%INPUT_DIR%" %%d in (.) do (
    set "CURRENT_DIR=%%d"
    set "CURRENT_DIR=!CURRENT_DIR:~0,-2!"
    
    :: Calculate relative path from INPUT_DIR
    set "REL_PATH=!CURRENT_DIR:%INPUT_DIR_ABS%=!"
    
    :: Skip if it's the root directory itself
    if not "!REL_PATH!"=="" (
        :: Remove leading backslash
        if "!REL_PATH:~0,1!"=="\" set "REL_PATH=!REL_PATH:~1!"
        
        set "INPUT_FOLDER=!CURRENT_DIR!"
        set "OUTPUT_FOLDER=%OUTPUT_DIR_ABS%\!REL_PATH!"
        set "INPUT_FOLDER_UNIX=!INPUT_FOLDER:\=/!"
        set "OUTPUT_FOLDER_UNIX=!OUTPUT_FOLDER:\=/!"
        
        echo Processing folder: "!REL_PATH!"
        echo   Input:  !INPUT_FOLDER_UNIX!
        echo   Output: !OUTPUT_FOLDER_UNIX!
        
        if not exist "!OUTPUT_FOLDER!" mkdir "!OUTPUT_FOLDER!"
        
        "%UPSCALE_BIN%" -i "!INPUT_FOLDER_UNIX!" -o "!OUTPUT_FOLDER_UNIX!" -m "%MODELS_DIR%" -n "%MODEL_NAME%" -s %SCALE% -f %FORMAT% -c %COMPRESS%
        
        if !errorlevel! equ 0 (
            echo   SUCCESS: Folder !REL_PATH! processed
        ) else (
            echo   ERROR: Failed to process folder !REL_PATH!
        )
        echo.
    )
)

echo.
echo Sprite upscaling process completed!
::pause
