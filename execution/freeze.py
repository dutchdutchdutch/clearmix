from flask_frozen import Freezer
from app import create_app
import os
import shutil

# Initialize app and freezer
app = create_app()
freezer = Freezer(app)

# Configuration
# Output to 'build' folder in project root (one level up from this script)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(BASE_DIR, 'build')

# Update app config to export to build directory
app.config['FREEZER_DESTINATION'] = BUILD_DIR
app.config['FREEZER_RELATIVE_URLS'] = True  # Makes it easier to host in subpaths if needed



def clean_build_dir():
    """Ensure a clean build directory exists."""
    if os.path.exists(BUILD_DIR):
        print(f"Cleaning existing build directory: {BUILD_DIR}")
        shutil.rmtree(BUILD_DIR)
    os.makedirs(BUILD_DIR)

if __name__ == '__main__':
    print("❄️  Freezing ClearMix for deployment...")
    
    # Clean previous build
    clean_build_dir()
    
    # Generate static site
    try:
        print("Freezing URLs:")
        for url in freezer.all_urls():
            print(f" - {url}")
        
        freezer.freeze()
        print(f"✅ Successfully frozen to: {os.path.abspath(BUILD_DIR)}")
        print("\nYou can now deploy the 'build' directory to Firebase Hosting.")
    except Exception as e:
        print(f"❌ Error freezing app: {e}")
        exit(1)
