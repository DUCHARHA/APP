from PIL import Image, ImageDraw, ImageFont
import os

def create_maskable_icon(size, filename):
    # Create image with purple background
    img = Image.new('RGBA', (size, size), color=(91, 33, 182, 255))
    draw = ImageDraw.Draw(img)
    
    # For maskable icons, content should be in safe zone (80% of icon)
    safe_zone = int(size * 0.8)
    margin = (size - safe_zone) // 2
    
    # Add white circle in safe zone
    circle_radius = safe_zone // 3
    circle_center = size // 2
    circle_coords = [
        circle_center - circle_radius,
        circle_center - circle_radius,
        circle_center + circle_radius,
        circle_center + circle_radius
    ]
    draw.ellipse(circle_coords, fill=(255, 255, 255, 230))
    
    # Add text 'Д' in center
    font_size = safe_zone // 4
    
    # Use default font since system fonts might not be available
    font = ImageFont.load_default()
    
    text = 'Д'
    # Get text size and center it
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2
    
    # Make text larger by drawing multiple times with offset
    for i in range(5):
        for j in range(5):
            draw.text((text_x + i - 2, text_y + j - 2), text, fill=(91, 33, 182, 255), font=font)
    
    # Save as PNG
    img.save(filename, 'PNG', optimize=True)
    print(f'Created maskable {filename} ({size}x{size})')

# Create maskable icons
try:
    create_maskable_icon(192, '192.png')
    create_maskable_icon(512, '512.png')
    print("Successfully created PWA icons!")
except Exception as e:
    print(f"Error creating icons: {e}")
