from PIL import Image, ImageDraw, ImageFont
import os

def create_professional_icon(size, filename):
    img = Image.new('RGBA', (size, size), color=(91, 33, 182, 255))
    draw = ImageDraw.Draw(img)
    
    safe_zone = int(size * 0.8)
    margin = (size - safe_zone) // 2
    
    center = size // 2
    outer_radius = int(safe_zone * 0.45)
    
    circle_width = max(8, int(size * 0.04))
    draw.ellipse(
        [center - outer_radius, center - outer_radius, 
         center + outer_radius, center + outer_radius],
        outline=(255, 255, 255, 230),
        width=circle_width
    )
    
    letter_width = int(size * 0.3)
    letter_height = int(size * 0.35)
    letter_thickness = max(10, int(size * 0.1))
    
    left_x = center - int(letter_width * 0.5)
    top_y = center - int(letter_height * 0.5)
    
    draw.rectangle(
        [left_x, top_y, left_x + letter_thickness, top_y + letter_height],
        fill=(255, 255, 255, 240)
    )
    
    arc_right = left_x + letter_width
    arc_center_y = center
    arc_radius = int(letter_width * 0.5)
    
    for i in range(letter_thickness):
        draw.arc(
            [left_x + letter_thickness, top_y, arc_right, top_y + letter_height],
            start=270, end=90,
            fill=(255, 255, 255, 240),
            width=1
        )
    
    draw.chord(
        [left_x + letter_thickness, top_y, arc_right, top_y + letter_height],
        start=270, end=90,
        fill=None,
        outline=(255, 255, 255, 240),
        width=letter_thickness
    )
    
    img.save(filename, 'PNG', optimize=True)
    print(f'Created professional icon {filename} ({size}x{size})')

try:
    create_professional_icon(192, '192.png')
    create_professional_icon(512, '512.png')
    create_professional_icon(512, 'logo.png')
    print("Successfully created PWA icons!")
except Exception as e:
    print(f"Error creating icons: {e}")
