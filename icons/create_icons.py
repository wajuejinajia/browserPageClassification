#!/usr/bin/env python3
"""
简单的图标生成脚本
生成不同尺寸的Chrome扩展图标
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # 创建图像
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制彩色圆形背景
    margin = size // 10
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill=(52, 152, 219, 255), outline=(41, 128, 185, 255), width=2)
    
    # 添加标签图标
    try:
        # 尝试使用系统字体
        font_size = size // 3
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        # 如果没有找到字体，使用默认字体
        font = ImageFont.load_default()
    
    # 绘制文字
    text = "🏷️"
    
    # 计算文字位置（居中）
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 2
    
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # 保存图像
    img.save(filename, 'PNG')
    print(f"Created {filename}")

# 创建不同尺寸的图标
sizes = [16, 48, 128]
for size in sizes:
    create_icon(size, f"icon{size}.png")

print("图标生成完成！")
print("如果你的系统没有PIL库，请运行: pip install Pillow")