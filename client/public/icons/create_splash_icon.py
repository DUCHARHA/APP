#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

def create_infinity_heart_logo(size, output_path):
    """Create a heart with infinity symbol logo"""
    # Create image with purple background
    img = Image.new('RGBA', (size, size), (91, 33, 182, 255))
    draw = ImageDraw.Draw(img)
    
    # Calculate center and scale
    center_x = size // 2
    center_y = size // 2
    scale = size / 512
    
    # Draw heart (white)
    heart_points = []
    # Simple heart shape using polygon
    heart_y_offset = -int(30 * scale)
    heart_scale = 1.5 * scale
    
    # Left side of heart
    for i in range(0, 180, 5):
        angle = i * 3.14159 / 180
        x = center_x - int(35 * heart_scale * (1 - 0.5 * abs(angle - 1.57)))
        y = center_y + heart_y_offset - int(40 * heart_scale * (1 + 0.3 * abs(angle - 1.57)))
        heart_points.append((x, y))
    
    # Bottom point of heart
    heart_points.append((center_x, center_y + heart_y_offset + int(70 * heart_scale)))
    
    # Right side of heart
    for i in range(180, 0, -5):
        angle = i * 3.14159 / 180
        x = center_x + int(35 * heart_scale * (1 - 0.5 * abs(angle - 1.57)))
        y = center_y + heart_y_offset - int(40 * heart_scale * (1 + 0.3 * abs(angle - 1.57)))
        heart_points.append((x, y))
    
    draw.polygon(heart_points, fill=(255, 255, 255, 255))
    
    # Draw infinity symbol (white)
    infinity_y = center_y + int(60 * scale)
    infinity_scale = 0.8 * scale
    infinity_width = int(50 * infinity_scale)
    infinity_height = int(30 * infinity_scale)
    infinity_thickness = max(int(8 * infinity_scale), 3)
    
    # Left loop
    draw.ellipse([
        center_x - int(60 * infinity_scale) - infinity_width,
        infinity_y - infinity_height,
        center_x - int(60 * infinity_scale) + infinity_width,
        infinity_y + infinity_height
    ], outline=(255, 255, 255, 255), width=infinity_thickness)
    
    # Right loop
    draw.ellipse([
        center_x + int(60 * infinity_scale) - infinity_width,
        infinity_y - infinity_height,
        center_x + int(60 * infinity_scale) + infinity_width,
        infinity_y + infinity_height
    ], outline=(255, 255, 255, 255), width=infinity_thickness)
    
    # Save image
    img.save(output_path, 'PNG')
    print(f"Created {output_path}")

# Create icons
script_dir = os.path.dirname(os.path.abspath(__file__))

# PWA icons
create_infinity_heart_logo(192, os.path.join(script_dir, '192.png'))
create_infinity_heart_logo(512, os.path.join(script_dir, '512.png'))
create_infinity_heart_logo(512, os.path.join(script_dir, 'logo.png'))

# Android launcher icons
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

# Android splash screens
splash_sizes = [
    ('drawable', 320),
    ('drawable-land-mdpi', 480),
    ('drawable-land-hdpi', 800),
    ('drawable-land-xhdpi', 1280),
    ('drawable-land-xxhdpi', 1600),
    ('drawable-land-xxxhdpi', 1920),
    ('drawable-port-mdpi', 480),
    ('drawable-port-hdpi', 800),
    ('drawable-port-xhdpi', 1280),
    ('drawable-port-xxhdpi', 1600),
    ('drawable-port-xxxhdpi', 1920),
]

for drawable, size in splash_sizes:
    output_dir = os.path.join(script_dir, f'../../../android/app/src/main/res/{drawable}')
    os.makedirs(output_dir, exist_ok=True)
    # For splash, we want just the icon on transparent background
    create_infinity_heart_logo(size, os.path.join(output_dir, 'splash.png'))

print("\nAll icons created successfully!")
