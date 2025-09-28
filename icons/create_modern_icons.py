#!/usr/bin/env python3
"""
创建现代化的TabFlow图标
"""

import os
from PIL import Image, ImageDraw, ImageFilter
import math

def create_gradient_circle(size, colors):
    """创建渐变圆形背景"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    radius = int(size * 0.45)
    
    # 创建渐变效果
    for i in range(radius):
        alpha = 1 - (i / radius) * 0.3
        # 从蓝紫色到粉色的渐变
        r = int(102 + (240 - 102) * (i / radius))
        g = int(126 + (147 - 126) * (i / radius))  
        b = int(234 + (251 - 234) * (i / radius))
        
        color = (r, g, b, int(255 * alpha))
        draw.ellipse([center - radius + i, center - radius + i, 
                     center + radius - i, center + radius - i], 
                    fill=color)
    
    return img

def create_tab_cards(img, size):
    """在图标上绘制标签页卡片"""
    draw = ImageDraw.Draw(img)
    
    # 计算比例
    scale = size / 128
    
    # 卡片颜色
    card_colors = [
        (255, 255, 255, 240),  # 白色半透明
        (248, 249, 250, 230),
        (255, 255, 255, 220),
        (248, 249, 250, 210)
    ]
    
    # 标签颜色指示器
    tab_colors = [
        (102, 126, 234),  # 蓝色
        (118, 75, 162),   # 紫色
        (240, 147, 251),  # 粉色
        (102, 126, 234)   # 蓝色
    ]
    
    # 绘制4张卡片
    positions = [
        (24 * scale, 42 * scale),
        (30 * scale, 52 * scale),
        (36 * scale, 62 * scale),
        (30 * scale, 72 * scale)
    ]
    
    for i, (x, y) in enumerate(positions):
        # 卡片主体
        card_width = int(44 * scale)
        card_height = int(10 * scale)
        radius = int(5 * scale)
        
        # 绘制圆角矩形（卡片）
        draw.rounded_rectangle([x, y, x + card_width, y + card_height], 
                             radius=radius, fill=card_colors[i])
        
        # 绘制标签颜色指示器
        indicator_x = x + 2 * scale
        indicator_y = y + 2 * scale
        indicator_width = int(8 * scale)
        indicator_height = int(6 * scale)
        
        draw.rounded_rectangle([indicator_x, indicator_y, 
                              indicator_x + indicator_width, 
                              indicator_y + indicator_height],
                             radius=int(1 * scale), 
                             fill=tab_colors[i] + (180,))

def create_flow_arrow(img, size):
    """创建流动箭头"""
    draw = ImageDraw.Draw(img)
    scale = size / 128
    
    # 箭头坐标
    arrow_points = [
        (82 * scale, 60 * scale),
        (92 * scale, 64 * scale),
        (82 * scale, 68 * scale),
        (85 * scale, 64 * scale)
    ]
    
    draw.polygon(arrow_points, fill=(255, 255, 255, 230))

def create_decorative_elements(img, size):
    """添加装饰性元素"""
    draw = ImageDraw.Draw(img)
    scale = size / 128
    
    # 装饰性小点
    points = [
        (88 * scale, 50 * scale, 1.5 * scale),
        (94 * scale, 78 * scale, 1 * scale),
        (90 * scale, 85 * scale, 0.8 * scale)
    ]
    
    for x, y, radius in points:
        alpha = int(255 * 0.6)
        draw.ellipse([x - radius, y - radius, x + radius, y + radius],
                    fill=(255, 255, 255, alpha))
    
    # 分组指示器线条
    line_y1 = 45 * scale
    line_y2 = 48 * scale
    line_x = 85 * scale
    
    draw.rounded_rectangle([line_x, line_y1, line_x + 12 * scale, line_y1 + 2 * scale],
                         radius=1 * scale, fill=(255, 255, 255, 200))
    draw.rounded_rectangle([line_x, line_y2, line_x + 8 * scale, line_y2 + 2 * scale],
                         radius=1 * scale, fill=(255, 255, 255, 150))

def create_icon(size):
    """创建指定尺寸的图标"""
    # 创建基础图像
    img = create_gradient_circle(size, [(102, 126, 234), (240, 147, 251)])
    
    # 添加各种元素
    create_tab_cards(img, size)
    create_flow_arrow(img, size)
    create_decorative_elements(img, size)
    
    # 应用轻微的模糊效果增加质感
    if size >= 48:
        img = img.filter(ImageFilter.SMOOTH_MORE)
    
    return img

def main():
    """主函数"""
    # 创建不同尺寸的图标
    sizes = [16, 48, 128]
    
    for size in sizes:
        print(f"正在创建 {size}x{size} 图标...")
        icon = create_icon(size)
        
        # 保存图标
        filename = f"icon{size}.png"
        icon.save(filename, "PNG", optimize=True)
        print(f"已保存: {filename}")
    
    print("所有图标创建完成！")

if __name__ == "__main__":
    main()