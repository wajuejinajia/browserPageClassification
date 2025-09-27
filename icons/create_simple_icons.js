// 简单的图标生成脚本，在浏览器控制台中运行
// 或者用Node.js运行（如果安装了canvas库）

function createSimpleIcon(size, filename) {
  // 创建SVG图标
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5856D6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="url(#grad)" stroke="white" stroke-width="2"/>
      <text x="${size/2}" y="${size/2+4}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size/2}" font-weight="bold">🏷️</text>
    </svg>
  `;
  
  console.log(`SVG for ${filename}:`, svg);
  return svg;
}

// 生成不同尺寸的图标
createSimpleIcon(16, 'icon16.png');
createSimpleIcon(48, 'icon48.png');
createSimpleIcon(128, 'icon128.png');

console.log('请将上面的SVG代码转换为PNG文件，或者直接使用SVG格式');