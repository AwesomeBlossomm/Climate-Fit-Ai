import os
import glob

def find_all_images():
    """Debug script to find all images in the backend directory"""
    backend_dir = os.path.dirname(__file__)
    
    # Directories to search
    search_dirs = [
        os.path.join(backend_dir, "uploads"),
        os.path.join(backend_dir, "images"),
        os.path.join(backend_dir, "routes", "images"),
        os.path.join(backend_dir, "routes", "images", "images_original"),
        backend_dir,  # Root directory
    ]
    
    # Image extensions to look for
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.bmp', '*.webp']
    
    print("=== IMAGE SEARCH RESULTS ===")
    
    for directory in search_dirs:
        print(f"\nSearching in: {directory}")
        if os.path.exists(directory):
            images = []
            for ext in extensions:
                pattern = os.path.join(directory, ext)
                images.extend(glob.glob(pattern))
                # Also search case-insensitive
                pattern = os.path.join(directory, ext.upper())
                images.extend(glob.glob(pattern))
            
            if images:
                print(f"  Found {len(images)} images:")
                for img in images[:10]:  # Show first 10
                    print(f"    - {os.path.basename(img)}")
                if len(images) > 10:
                    print(f"    ... and {len(images) - 10} more")
            else:
                print("  No images found")
        else:
            print("  Directory does not exist")
    
    # Also check for specific UUID patterns
    print(f"\n=== CHECKING FOR UUID IMAGES ===")
    uuid_patterns = [
        "*-*-*-*-*.jpg",
        "*-*-*-*-*.jpeg",
        "*-*-*-*-*.png",
    ]
    
    for directory in search_dirs:
        if os.path.exists(directory):
            for pattern in uuid_patterns:
                full_pattern = os.path.join(directory, pattern)
                matches = glob.glob(full_pattern)
                if matches:
                    print(f"Found UUID images in {directory}:")
                    for match in matches[:5]:  # Show first 5
                        print(f"  - {os.path.basename(match)}")

if __name__ == "__main__":
    find_all_images()
