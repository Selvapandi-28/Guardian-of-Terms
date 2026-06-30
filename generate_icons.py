from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    padding = size * 0.1
    cx = size / 2
    
    # Colors
    border_color = (139, 92, 246, 255) # purple #8b5cf6
    shield_color = (59, 130, 246, 255) # blue #3b82f6
    
    # Outer shield shape coordinates
    points = [
        (cx - size*0.35, padding + size*0.15),       # top-left
        (cx, padding),                               # top-center (peak)
        (cx + size*0.35, padding + size*0.15),       # top-right
        (cx + size*0.35, size - padding - size*0.2), # mid-right
        (cx, size - padding),                        # bottom-tip
        (cx - size*0.35, size - padding - size*0.2)  # mid-left
    ]
    
    # Draw outer shield border
    draw.polygon(points, fill=border_color)
    
    # Inner shield shape (smaller, to create border effect)
    inner_points = [
        (cx - size*0.28, padding + size*0.17),
        (cx, padding + size*0.04),
        (cx + size*0.28, padding + size*0.17),
        (cx + size*0.28, size - padding - size*0.22),
        (cx, size - padding - size*0.05),
        (cx - size*0.28, size - padding - size*0.22)
    ]
    draw.polygon(inner_points, fill=shield_color)
    
    # Draw white letter 'P' (Privacy Shield)
    stem_x = cx - size * 0.08
    stem_y_start = size * 0.3
    stem_y_end = size * 0.7
    line_width = max(2, int(size * 0.08))
    
    # Draw vertical stem of 'P'
    draw.line([(stem_x, stem_y_start), (stem_x, stem_y_end)], fill=(255, 255, 255, 255), width=line_width)
    
    # Draw loop of 'P'
    loop_radius = size * 0.14
    loop_bbox = [stem_x - line_width/2, stem_y_start, stem_x + loop_radius*2, stem_y_start + loop_radius*2]
    draw.arc(loop_bbox, start=270, end=90, fill=(255, 255, 255, 255), width=line_width)
    
    # Connect loop ends to the stem
    draw.line([(stem_x, stem_y_start), (stem_x + loop_radius, stem_y_start)], fill=(255, 255, 255, 255), width=line_width)
    draw.line([(stem_x, stem_y_start + loop_radius*2), (stem_x + loop_radius, stem_y_start + loop_radius*2)], fill=(255, 255, 255, 255), width=line_width)

    return img

if __name__ == "__main__":
    import os
    print("Generating extension icons...")
    for size in [16, 48, 128]:
        img = create_icon(size)
        filename = f"icon{size}.png"
        img.save(filename)
        print(f"Saved {filename}")
    print("Done!")
