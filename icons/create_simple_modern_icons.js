// 使用Canvas API创建现代化图标
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, size, size);
    
    const scale = size / 128;
    const center = size / 2;
    const radius = size * 0.45;
    
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    
    // 绘制背景圆形
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 添加阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetY = 2 * scale;
    
    // 绘制标签页卡片
    const cardPositions = [
        [24 * scale, 42 * scale],
        [30 * scale, 52 * scale],
        [36 * scale, 62 * scale],
        [30 * scale, 72 * scale]
    ];
    
    const tabColors = ['#667eea', '#764ba2', '#f093fb', '#667eea'];
    
    cardPositions.forEach((pos, i) => {
        // 卡片主体
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(pos[0], pos[1], 44 * scale, 10 * scale);
        
        // 标签颜色指示器
        ctx.fillStyle = tabColors[i];
        ctx.fillRect(pos[0] + 2 * scale, pos[1] + 2 * scale, 8 * scale, 6 * scale);
    });
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    
    // 绘制流动箭头
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(82 * scale, 60 * scale);
    ctx.lineTo(92 * scale, 64 * scale);
    ctx.lineTo(82 * scale, 68 * scale);
    ctx.lineTo(85 * scale, 64 * scale);
    ctx.closePath();
    ctx.fill();
    
    // 装饰性小点
    const points = [
        [88 * scale, 50 * scale, 1.5 * scale],
        [94 * scale, 78 * scale, 1 * scale],
        [90 * scale, 85 * scale, 0.8 * scale]
    ];
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0], point[1], point[2], 0, 2 * Math.PI);
        ctx.fill();
    });
    
    return canvas;
}

// 检查是否有canvas模块
try {
    // 创建不同尺寸的图标
    const sizes = [16, 48, 128];
    
    sizes.forEach(size => {
        console.log(`创建 ${size}x${size} 图标...`);
        const canvas = createIcon(size);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`icon${size}.png`, buffer);
        console.log(`已保存: icon${size}.png`);
    });
    
    console.log('所有图标创建完成！');
} catch (error) {
    console.log('Canvas模块未安装，使用SVG转换方法...');
    
    // 如果没有canvas模块，创建一个简化的SVG图标
    const svgContent = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="50%" style="stop-color:#764ba2"/>
      <stop offset="100%" style="stop-color:#f093fb"/>
    </linearGradient>
  </defs>
  
  <circle cx="64" cy="64" r="58" fill="url(#bg)"/>
  
  <!-- 标签页卡片 -->
  <rect x="24" y="42" width="44" height="10" rx="2" fill="rgba(255,255,255,0.9)"/>
  <rect x="26" y="44" width="8" height="6" rx="1" fill="#667eea"/>
  
  <rect x="30" y="52" width="44" height="10" rx="2" fill="rgba(255,255,255,0.9)"/>
  <rect x="32" y="54" width="8" height="6" rx="1" fill="#764ba2"/>
  
  <rect x="36" y="62" width="44" height="10" rx="2" fill="rgba(255,255,255,0.9)"/>
  <rect x="38" y="64" width="8" height="6" rx="1" fill="#f093fb"/>
  
  <rect x="30" y="72" width="44" height="10" rx="2" fill="rgba(255,255,255,0.9)"/>
  <rect x="32" y="74" width="8" height="6" rx="1" fill="#667eea"/>
  
  <!-- 箭头 -->
  <path d="M 82 60 L 92 64 L 82 68 L 85 64 Z" fill="rgba(255,255,255,0.9)"/>
  
  <!-- 装饰点 -->
  <circle cx="88" cy="50" r="1.5" fill="rgba(255,255,255,0.6)"/>
  <circle cx="94" cy="78" r="1" fill="rgba(255,255,255,0.5)"/>
</svg>`;
    
    fs.writeFileSync('tabflow_final.svg', svgContent);
    console.log('已创建SVG图标: tabflow_final.svg');
    console.log('请使用在线工具将SVG转换为PNG格式的图标');
}