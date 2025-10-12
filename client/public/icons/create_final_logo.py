#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os
import math

def create_heart_infinity_logo(size, output_path, bg_color=(91, 33, 182, 255)):
    """Create a beautiful heart with infinity symbol logo"""
    # Create image with purple background
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Calculate center and scale
    center_x = size // 2
    center_y = size // 2
    scale = size / 512.0
    
    # Draw heart (white) - positioned higher
    heart_points = []
    heart_size = 100 * scale
    heart_y_offset = -50 * scale
    
    # Create heart shape using bezier-like points
    for t in range(0, 360):
        angle = math.radians(t)
        # Heart curve formula
        x = 16 * math.sin(angle) ** 3
        y = -(13 * math.cos(angle) - 5 * math.cos(2*angle) - 2 * math.cos(3*angle) - math.cos(4*angle))
        
        px = center_x + x * heart_size / 16
        py = center_y + heart_y_offset + y * heart_size / 16
        heart_points.append((px, py))
    
    draw.polygon(heart_points, fill=(255, 255, 255, 255))
    
    # Draw infinity symbol (white) - positioned below heart
    infinity_y = center_y + int(80 * scale)
    infinity_scale = scale * 1.2
    thickness = max(int(12 * scale), 4)
    
    # Left circle of infinity
    left_center_x = center_x - int(45 * infinity_scale)
    draw.ellipse([
        left_center_x - int(35 * infinity_scale),
        infinity_y - int(25 * infinity_scale),
        left_center_x + int(35 * infinity_scale),
        infinity_y + int(25 * infinity_scale)
    ], outline=(255, 255, 255, 255), width=thickness)
    
    # Right circle of infinity
    right_center_x = center_x + int(45 * infinity_scale)
    draw.ellipse([
        right_center_x - int(35 * infinity_scale),
        infinity_y - int(25 * infinity_scale),
        right_center_x + int(35 * infinity_scale),
        infinity_y + int(25 * infinity_scale)
    ], outline=(255, 255, 255, 255), width=thickness)
    
    # Fill the center crossing to make it look connected
    cross_points = [
        (center_x - int(5 * infinity_scale), infinity_y - int(15 * infinity_scale)),
        (center_x + int(5 * infinity_scale), infinity_y - int(15 * infinity_scale)),
        (center_x + int(5 * infinity_scale), infinity_y + int(15 * infinity_scale)),
        (center_x - int(5 * infinity_scale), infinity_y + int(15 * infinity_scale))
    ]
    draw.polygon(cross_points, fill=(255, 255, 255, 255))
    
    # Save image
    img.save(output_path, 'PNG')
    print(f"✓ Created {output_path}")

def create_transparent_icon(size, output_path):
    """Create logo with transparent background for foreground icons"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center_x = size // 2
    center_y = size // 2
    scale = size / 512.0
    
    # Draw heart
    heart_points = []
    heart_size = 100 * scale
    heart_y_offset = -50 * scale
    
    for t in range(0, 360):
        angle = math.radians(t)
        x = 16 * math.sin(angle) ** 3
        y = -(13 * math.cos(angle) - 5 * math.cos(2*angle) - 2 * math.cos(3*angle) - math.cos(4*angle))
        
        px = center_x + x * heart_size / 16
        py = center_y + heart_y_offset + y * heart_size / 16
        heart_points.append((px, py))
    
    draw.polygon(heart_points, fill=(255, 255, 255, 255))
    
    # Draw infinity symbol
    infinity_y = center_y + int(80 * scale)
    infinity_scale = scale * 1.2
    thickness = max(int(12 * scale), 4)
    
    left_center_x = center_x - int(45 * infinity_scale)
    draw.ellipse([
        left_center_x - int(35 * infinity_scale),
        infinity_y - int(25 * infinity_scale),
        left_center_x + int(35 * infinity_scale),
        infinity_y + int(25 * infinity_scale)
    ], outline=(255, 255, 255, 255), width=thickness)
    
    right_center_x = center_x + int(45 * infinity_scale)
    draw.ellipse([
        right_center_x - int(35 * infinity_scale),
        infinity_y - int(25 * infinity_scale),
        right_center_x + int(35 * infinity_scale),
        infinity_y + int(25 * infinity_scale)
    ], outline=(255, 255, 255, 255), width=thickness)
    
    cross_points = [
        (center_x - int(5 * infinity_scale), infinity_y - int(15 * infinity_scale)),
        (center_x + int(5 * infinity_scale), infinity_y - int(15 * infinity_scale)),
        (center_x + int(5 * infinity_scale), infinity_y + int(15 * infinity_scale)),
        (center_x - int(5 * infinity_scale), infinity_y + int(15 * infinity_scale))
    ]
    draw.polygon(cross_points, fill=(255, 255, 255, 255))
    
    img.save(output_path, 'PNG')
    print(f"✓ Created {output_path}")

# Main execution
script_dir = os.path.dirname(os.path.abspath(__file__))

print("🎨 Creating DUCHARHA logo with heart ♥ and infinity ∞ symbol...\n")

# PWA icons
print("📱 Creating PWA icons...")
create_heart_infinity_logo(192, os.path.join(script_dir, '192.png'))
create_heart_infinity_logo(512, os.path.join(script_dir, '512.png'))
create_heart_infinity_logo(512, os.path.join(script_dir, 'logo.png'))

# Android launcher icons
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
    create_heart_infinity_logo(icon_size, os.path.join(output_dir, 'ic_launcher.png'))
    create_heart_infinity_logo(icon_size, os.path.join(output_dir, 'ic_launcher_round.png'))
    create_transparent_icon(icon_size, os.path.join(output_dir, 'ic_launcher_foreground.png'))

# Android splash screens (with purple background)
print("\n🎨 Creating Android splash screens...")
splash_configs = [
    ('drawable', 512),
    ('drawable-land-mdpi', 800),
    ('drawable-land-hdpi', 1280),
    ('drawable-land-xhdpi', 1920),
    ('drawable-land-xxhdpi', 2560),
    ('drawable-land-xxxhdpi', 3200),
    ('drawable-port-mdpi', 800),
    ('drawable-port-hdpi', 1280),
    ('drawable-port-xhdpi', 1920),
    ('drawable-port-xxhdpi', 2560),
    ('drawable-port-xxxhdpi', 3200),
]

for drawable, splash_size in splash_configs:
    output_dir = os.path.join(script_dir, f'../../../android/app/src/main/res/{drawable}')
    os.makedirs(output_dir, exist_ok=True)
    # Splash uses transparent icon on purple background (handled by Android)
    create_transparent_icon(splash_size, os.path.join(output_dir, 'splash.png'))

print("\n✨ All icons created successfully!")
print("🎉 Your beautiful heart ♥ infinity ∞ logo is ready!")
