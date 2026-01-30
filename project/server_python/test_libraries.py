"""
Test script to verify all Python 3.12 libraries are working
"""
import sys

print(f"Python version: {sys.version}")
print("\nTesting installed libraries...\n")

# Test Core Libraries
try:
    import fastapi
    print("✅ FastAPI:", fastapi.__version__)
except ImportError as e:
    print("❌ FastAPI:", e)

try:
    import uvicorn
    print("✅ Uvicorn:", uvicorn.__version__)
except ImportError as e:
    print("❌ Uvicorn:", e)

try:
    import motor
    print("✅ Motor: OK")
except ImportError as e:
    print("❌ Motor:", e)

# Test Data Analysis
try:
    import pandas as pd
    print("✅ Pandas:", pd.__version__)
except ImportError as e:
    print("❌ Pandas:", e)

try:
    import openpyxl
    print("✅ OpenPyXL:", openpyxl.__version__)
except ImportError as e:
    print("❌ OpenPyXL:", e)

# Test Visualization
try:
    import matplotlib
    print("✅ Matplotlib:", matplotlib.__version__)
except ImportError as e:
    print("❌ Matplotlib:", e)

try:
    import seaborn as sns
    print("✅ Seaborn:", sns.__version__)
except ImportError as e:
    print("❌ Seaborn:", e)

# Test PDF Generation
try:
    import reportlab
    print("✅ ReportLab:", reportlab.Version)
except ImportError as e:
    print("❌ ReportLab:", e)

# Test Security
try:
    from passlib.context import CryptContext
    print("✅ Passlib: OK")
except ImportError as e:
    print("❌ Passlib:", e)

try:
    from jose import jwt
    print("✅ Python-JOSE: OK")
except ImportError as e:
    print("❌ Python-JOSE:", e)

# Test Image Processing (NEW with Python 3.12!)
try:
    import cv2
    print("✅ OpenCV:", cv2.__version__)
except ImportError as e:
    print("❌ OpenCV:", e)

try:
    from PIL import Image
    import PIL
    print("✅ Pillow:", PIL.__version__)
except ImportError as e:
    print("❌ Pillow:", e)

try:
    import moviepy
    print("✅ MoviePy:", moviepy.__version__)
except ImportError as e:
    print("❌ MoviePy:", e)

print("\n" + "="*50)
print("Library check complete!")
print("="*50)
