#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os
import math

def create_infinity_heart_logo(size, output_path):
    """Create a high-quality heart with infinity symbol logo matching the brand design"""
    # Create image with purple background
    img = Image.new('RGBA', (size, size), (91, 33, 182, 255))
    draw = ImageDraw.Draw(img)
    
    # Calculate center and scale
    center_x = size // 2
    center_y = size // 2
    scale = size / 512
    
    # Line thickness
    line_width = max(int(14 * scale), 5)
    
    # DRAW HEART (top part)
    heart_size = int(70 * scale)
    heart_y_offset = -int(45 * scale)
    
    # Create proper heart shape
    heart_points = []
    
    # Left curve of heart
    for i in range(180, -1, -3):
        angle = math.radians(i)
        x = center_x - heart_size * 0.4 - heart_size * 0.3 * math.cos(angle)
        y = center_y + heart_y_offset - heart_size * 0.3 * math.sin(angle)
        heart_points.append((x, y))
    
    # Bottom tip of heart
    heart_points.append((center_x, center_y + heart_y_offset + heart_size * 0.8))
    
    # Right curve of heart
    for i in range(0, 181, 3):
        angle = math.radians(i)
        x = center_x + heart_size * 0.4 + heart_size * 0.3 * math.cos(angle)
        y = center_y + heart_y_offset - heart_size * 0.3 * math.sin(angle)
        heart_points.append((x, y))
    
    # Draw filled heart
    draw.polygon(heart_points, fill=(255, 255, 255, 255))
    
    # DRAW INFINITY SYMBOL (bottom part)
    infinity_y = center_y + int(45 * scale)
    infinity_width = int(50 * scale)
    infinity_height = int(30 * scale)
    
    # Left loop
    left_x = center_x - int(50 * scale)
    draw.ellipse([
        left_x - infinity_width,
        infinity_y - infinity_height,
        left_x + infinity_width,
        infinity_y + infinity_height
    ], outline=(255, 255, 255, 255), width=line_width)
    
    # Right loop
    right_x = center_x + int(50 * scale)
    draw.ellipse([
        right_x - infinity_width,
        infinity_y - infinity_height,
        right_x + infinity_width,
        infinity_y + infinity_height
    ], outline=(255, 255, 255, 255), width=line_width)
    
    # Save image
    img.save(output_path, 'PNG', quality=95)
    print(f"Created {output_path} ({size}x{size})")

def create_high_quality_splash(base_size, output_path):
    """Create splash at 2x resolution then downsample for better quality"""
    # Create at double size
    work_size = base_size * 2
    img = Image.new('RGBA', (work_size, work_size), (91, 33, 182, 255))
    draw = ImageDraw.Draw(img)
    
    center_x = work_size // 2
    center_y = work_size // 2
    scale = work_size / 512
    
    line_width = max(int(14 * scale), 5)
    
    # DRAW HEART
    heart_size = int(70 * scale)
    heart_y_offset = -int(45 * scale)
    
    heart_points = []
    for i in range(180, -1, -2):
        angle = math.radians(i)
        x = center_x - heart_size * 0.4 - heart_size * 0.3 * math.cos(angle)
        y = center_y + heart_y_offset - heart_size * 0.3 * math.sin(angle)
        heart_points.append((x, y))
    
    heart_points.append((center_x, center_y + heart_y_offset + heart_size * 0.8))
    
    for i in range(0, 181, 2):
        angle = math.radians(i)
        x = center_x + heart_size * 0.4 + heart_size * 0.3 * math.cos(angle)
        y = center_y + heart_y_offset - heart_size * 0.3 * math.sin(angle)
        heart_points.append((x, y))
    
    draw.polygon(heart_points, fill=(255, 255, 255, 255))
    
    # DRAW INFINITY SYMBOL
    infinity_y = center_y + int(45 * scale)
    infinity_width = int(50 * scale)
    infinity_height = int(30 * scale)
    
    left_x = center_x - int(50 * scale)
    draw.ellipse([
        left_x - infinity_width,
        infinity_y - infinity_height,
        left_x + infinity_width,
        infinity_y + infinity_height
    ], outline=(255, 255, 255, 255), width=line_width)
    
    right_x = center_x + int(50 * scale)
    draw.ellipse([
        right_x - infinity_width,
        infinity_y - infinity_height,
        right_x + infinity_width,
        infinity_y + infinity_height
    ], outline=(255, 255, 255, 255), width=line_width)
    
    # Downsample for anti-aliasing
    img = img.resize((base_size, base_size), Image.Resampling.LANCZOS)
    img.save(output_path, 'PNG', quality=95)
    print(f"Created {output_path} ({base_size}x{base_size}) - high quality")

# Create icons
script_dir = os.path.dirname(os.path.abspath(__file__))

print("Creating PWA icons...")
create_infinity_heart_logo(192, os.path.join(script_dir, '192.png'))
create_infinity_heart_logo(512, os.path.join(script_dir, '512.png'))
create_infinity_heart_logo(512, os.path.join(script_dir, 'logo.png'))

# Android launcher icons
print("\nCreating Android launcher icons...")
android_sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}

for density, size in android_sizes.items():
    output_dir = os.path.join(script_dir, f'../../../android/app/src/main/res/mipmap-{density}')
    os.makedirs(output_dir, exist_ok=True)
    create_infinity_heart_logo(size, os.path.join(output_dir, 'ic_launcher.png'))
    create_infinity_heart_logo(size, os.path.join(output_dir, 'ic_launcher_round.png'))
    create_infinity_heart_logo(size, os.path.join(output_dir, 'ic_launcher_foreground.png'))

# Android splash screens - create high quality versions
print("\nCreating high-quality splash screens...")
splash_sizes = [
    ('drawable', 512),
    ('drawable-land-mdpi', 640),
    ('drawable-land-hdpi', 960),
    ('drawable-land-xhdpi', 1440),
    ('drawable-land-xxhdpi', 1920),
    ('drawable-land-xxxhdpi', 2560),
    ('drawable-port-mdpi', 640),
    ('drawable-port-hdpi', 960),
    ('drawable-port-xhdpi', 1440),
    ('drawable-port-xxhdpi', 1920),
    ('drawable-port-xxxhdpi', 2560),
]

for drawable, size in splash_sizes:
    output_dir = os.path.join(script_dir, f'../../../android/app/src/main/res/{drawable}')
    os.makedirs(output_dir, exist_ok=True)
    create_high_quality_splash(size, os.path.join(output_dir, 'splash.png'))

print("\n✅ All icons created successfully!")
print("✅ High-resolution splash screens generated for all device densities")
print("✅ Logo matches brand design: heart ❤️ + infinity ∞")
