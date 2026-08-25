import os
import urllib.request
import concurrent.futures
import base64

# Create dir
os.makedirs('public/fonts/mushaf', exist_ok=True)

# Generate a base64 encoded payload or fetch script
print("Checking mushaf fonts status...")
count = len([f for f in os.listdir('public/fonts/mushaf') if f.endswith('.woff2')])
print(f"Total woff2 fonts currently in public/fonts/mushaf: {count}/604")
