from PIL import Image, ImageDraw
import math

# Create 2732x2732 splash screen (universal size for all devices)
size = 2732
img = Image.new('RGB', (size, size), color=(91, 33, 182))  # #5B21B6 purple background
draw = ImageDraw.Draw(img)

# Center coordinates
cx, cy = size // 2, size // 2

# Logo size - make it big but not too big
logo_scale = size // 4  # 25% of screen size

# Draw white infinity symbol with heart
# Infinity symbol parameters
infinity_width = logo_scale * 1.8
infinity_height = logo_scale * 0.6
infinity_y = cy + logo_scale // 8
line_width = int(logo_scale * 0.15)  # Thick lines for visibility

# Left circle of infinity
left_x = cx - infinity_width // 4
draw.ellipse([
    left_x - infinity_width // 4,
    infinity_y - infinity_height // 2,
    left_x + infinity_width // 4,
    infinity_y + infinity_height // 2
], outline=(255, 255, 255), width=line_width)

# Right circle of infinity
right_x = cx + infinity_width // 4
draw.ellipse([
    right_x - infinity_width // 4,
    infinity_y - infinity_height // 2,
    right_x + infinity_width // 4,
    infinity_y + infinity_height // 2
], outline=(255, 255, 255), width=line_width)

# Draw heart shape above infinity
heart_y = cy - logo_scale // 2.5
heart_size = logo_scale // 2.5

# Heart - create using polygon for better shape
def draw_heart(draw, cx, cy, size, color):
    # Heart shape as filled polygon
    points = []
    
    # Top left curve
    for angle in range(180, 0, -10):
        rad = math.radians(angle)
        x = cx - size * 0.35 + (size * 0.35) * math.cos(rad)
        y = cy - size * 0.5 + (size * 0.35) * math.sin(rad)
        points.append((x, y))
    
    # Top right curve
    for angle in range(180, 0, -10):
        rad = math.radians(angle)
        x = cx + size * 0.35 + (size * 0.35) * math.cos(rad)
        y = cy - size * 0.5 + (size * 0.35) * math.sin(rad)
        points.append((x, y))
    
    # Bottom point
    points.append((cx, cy + size * 0.5))
    
    # Close the path
    points.append(points[0])
    
    draw.polygon(points, fill=color)

# Draw white heart
draw_heart(draw, cx, heart_y, heart_size, (255, 255, 255))

# Save the image
output_path = 'resources/splash.png'
img.save(output_path, 'PNG', optimize=True)
print(f'✅ Created professional full-screen splash screen: {output_path}')
print(f'   Size: {size}x{size}')
print(f'   Background: Purple #5B21B6 (full screen)')
print(f'   Logo: White infinity symbol with heart (no white square)')
