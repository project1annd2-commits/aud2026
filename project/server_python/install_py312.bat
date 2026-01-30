@echo off
echo Installing Python 3.12 dependencies...
echo.

REM Use Python 3.12 specifically
py -3.12 -m pip install --upgrade pip
py -3.12 -m pip install -r requirements.txt

echo.
echo Installation complete!
echo.
echo To run the server with Python 3.12, use:
echo py -3.12 main.py
pause
