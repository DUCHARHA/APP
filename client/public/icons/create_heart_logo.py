#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os
import math

def create_sharp_heart_logo(size, output_path, bg_color=(91, 33, 182, 255)):
    """Create a sharp, beautiful heart logo"""
    # Create image with exact purple background #5B21B6
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Calculate center and scale
    center_x = size // 2
    center_y = size // 2
    
    # Make heart bigger and sharper - use 40% of image size
    heart_size = size * 0.40
    
    # Create high-quality heart shape using mathematical formula
    heart_points = []
    
    # Generate smooth heart curve with more points for sharpness
    for t in range(0, 360, 1):  # More points = smoother/sharper
        angle = math.radians(t)
        # Perfect heart curve formula
        x = 16 * math.sin(angle) ** 3
        y = -(13 * math.cos(angle) - 5 * math.cos(2*angle) - 2 * math.cos(3*angle) - math.cos(4*angle))
        
        # Scale and position
        px = center_x + x * heart_size / 16
        py = center_y + y * heart_size / 16
        heart_points.append((px, py))
    
    # Draw filled white heart
    draw.polygon(heart_points, fill=(255, 255, 255, 255))
    
    # Add anti-aliasing by drawing outline
    draw.polygon(heart_points, outline=(255, 255, 255, 255))
    
    # Save with maximum quality
    img.save(output_path, 'PNG', quality=100, optimize=False)
    print(f"✓ Created {output_path}")

def create_transparent_heart(size, output_path):
    """Create heart with transparent background for foreground icons"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center_x = size // 2
    center_y = size // 2
    heart_size = size * 0.40
    
    heart_points = []
    for t in range(0, 360, 1):
        angle = math.radians(t)
        x = 16 * math.sin(angle) ** 3
        y = -(13 * math.cos(angle) - 5 * math.cos(2*angle) - 2 * math.cos(3*angle) - math.cos(4*angle))
        
        px = center_x + x * heart_size / 16
        py = center_y + y * heart_size / 16
        heart_points.append((px, py))
    
    draw.polygon(heart_points, fill=(255, 255, 255, 255))
    draw.polygon(heart_points, outline=(255, 255, 255, 255))
    
    img.save(output_path, 'PNG', quality=100, optimize=False)
    print(f"✓ Created {output_path}")

# Main execution
script_dir = os.path.dirname(os.path.abspath(__file__))

print("❤️  Creating DUCHARHA heart logo...\n")
print("Color: #5B21B6 (RGB: 91, 33, 182)")
print("Design: White heart on purple background\n")

# PWA icons
print("📱 Creating PWA icons...")
create_sharp_heart_logo(192, os.path.join(script_dir, '192.png'))
create_sharp_heart_logo(512, os.path.join(script_dir, '512.png'))
create_sharp_heart_logo(512, os.path.join(script_dir, 'logo.png'))

# Android launcher icons - higher resolution for sharpness
print("\n📱 Creating Android launcher icons...")
android_sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}

for density, icon_size in android_sizes.items():
    output_dir = os.path.join(script_dir, f'../../../android/app/src/main/res/mipmap-{density}')
    os.makedirs(output_dir, exist_ok=True)
    create_sharp_heart_logo(icon_size, os.path.join(output_dir, 'ic_launcher.png'))
    create_sharp_heart_logo(icon_size, os.path.join(output_dir, 'ic_launcher_round.png'))
    create_transparent_heart(icon_size, os.path.join(output_dir, 'ic_launcher_foreground.png'))

# Android splash screens - very high resolution for sharpness
print("\n🎨 Creating Android splash screens (high resolution)...")
splash_configs = [
    ('drawable', 800),
    ('drawable-land-mdpi', 960),
    ('drawable-land-hdpi', 1280),
    ('drawable-land-xhdpi', 1920),
    ('drawable-land-xxhdpi', 2560),
    ('drawable-land-xxxhdpi', 3840),
    ('drawable-port-mdpi', 960),
    ('drawable-port-hdpi', 1280),
    ('drawable-port-xhdpi', 1920),
    ('drawable-port-xxhdpi', 2560),
    ('drawable-port-xxxhdpi', 3840),
]

for drawable, splash_size in splash_configs:
    output_dir = os.path.join(script_dir, f'../../../android/app/src/main/res/{drawable}')
    os.makedirs(output_dir, exist_ok=True)
    # For splash, create transparent heart on the configured purple background
    create_transparent_heart(splash_size, os.path.join(output_dir, 'splash.png'))

print("\n✨ All icons created successfully!")
print("❤️  Sharp white heart logo is ready!")
print("🎨 Background color: #5B21B6")
