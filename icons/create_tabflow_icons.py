#!/usr/bin/env python3
"""
TabFlow 图标生成脚本
设计理念：流动的标签页，现代简洁的设计
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_tabflow_icon(size, filename):
    # 创建透明背景图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 计算尺寸
    margin = size // 8
    center_x = size // 2
    center_y = size // 2
    
    # TabFlow 设计：三个流动的标签页卡片
    card_width = size * 0.6
    card_height = size * 0.15
    
    # 渐变色：从蓝色到紫色的流动感
    colors = [
        (0, 122, 255, 255),    # 系统蓝 #007AFF
        (88, 86, 214, 255),    # 系统紫 #5856D6  
        (191, 90, 242, 255)    # 系统淡紫 #BF5AF2
    ]
    
    # 绘制三个重叠的卡片，营造流动感
    for i, color in enumerate(colors):
        # 计算每个卡片的位置，创造流动效果
        offset_x = i * (size * 0.08)
        offset_y = i * (size * 0.06)
        
        # 卡片位置
        x1 = margin + offset_x
        y1 = center_y - card_height + offset_y
        x2 = x1 + card_width
        y2 = y1 + card_height
        
        # 绘制圆角矩形卡片
        radius = size // 16
        draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=color)
        
        # 添加高光效果
        highlight_color = tuple(min(255, c + 30) for c in color[:3]) + (128,)
        draw.rounded_rectangle([x1, y1, x2, y1 + radius], radius=radius, fill=highlight_color)
    
    # 在中心添加流动箭头
    arrow_size = size * 0.2
    arrow_x = center_x + size * 0.15
    arrow_y = center_y
    
    # 绘制流动箭头
    arrow_points = [
        (arrow_x - arrow_size//2, arrow_y - arrow_size//4),
        (arrow_x + arrow_size//4, arrow_y),
        (arrow_x - arrow_size//2, arrow_y + arrow_size//4)
    ]
    draw.polygon(arrow_points, fill=(255, 255, 255, 200))
    
    # 保存图像
    img.save(filename, 'PNG')
    print(f"Created TabFlow icon: {filename}")

def create_simple_tabflow_icon(size, filename):
    """创建简化版本的TabFlow图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 背景圆形
    margin = size // 10
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill=(0, 122, 255, 255))  # 系统蓝
    
    # 内部的流动标签设计
    center = size // 2
    
    # 绘制三个小矩形代表标签页
    rect_width = size // 6
    rect_height = size // 12
    
    for i in range(3):
        x = center - rect_width//2 + (i-1) * (rect_width//3)
        y = center - rect_height//2 + i * (rect_height//2)
        
        # 白色半透明矩形
        draw.rectangle([x, y, x + rect_width, y + rect_height], 
                      fill=(255, 255, 255, 180))
    
    img.save(filename, 'PNG')
    print(f"Created simple TabFlow icon: {filename}")

# 生成不同尺寸的图标
sizes = [16, 48, 128]

print("生成 TabFlow 图标...")
for size in sizes:
    if size <= 32:
        # 小尺寸使用简化版本
        create_simple_tabflow_icon(size, f"icon{size}.png")
    else:
        # 大尺寸使用详细版本
        create_tabflow_icon(size, f"icon{size}.png")

print("\n✨ TabFlow 图标生成完成！")
print("图标设计理念：")
print("- 流动的标签页卡片，体现 'Flow' 概念")
print("- 渐变蓝紫色系，现代且专业")
print("- 简洁的设计，在各种尺寸下都清晰可见")
print("\n如果系统没有PIL库，请运行: pip install Pillow")