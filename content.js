// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateTabColor') {
    updateTabTitle(request.domain, request.displayName, request.color, request.groupInfo);
  }
});

// 更新标签页标题，添加域名分类标记
function updateTabTitle(domain, displayName, color, groupInfo) {
  const originalTitle = document.title;
  
  // 使用显示名称而不是域名
  const colorDot = '●';
  
  // 检查标题是否已经包含域名标记
  if (!originalTitle.includes('●') && !originalTitle.includes(`[${displayName}]`)) {
    // 在标题前添加彩色圆点和显示名称
    document.title = `${colorDot} ${displayName} | ${originalTitle}`;
    
    // 更新favicon添加颜色标识
    updateFavicon(color, displayName);
  }
  
  // 不再添加页面内的视觉指示器
}

// 更新页面图标 - 添加域名颜色边框
function updateFavicon(color, displayName) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 16;
    canvas.height = 16;
    
    // 先绘制彩色背景边框
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
    
    // 在中间留白区域
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 12, 12);
    
    const originalFavicon = document.querySelector('link[rel="icon"]') || 
                           document.querySelector('link[rel="shortcut icon"]');
    
    if (originalFavicon) {
      const img = new Image();
      img.onload = () => {
        // 在白色区域绘制原始图标
        ctx.drawImage(img, 2, 2, 12, 12);
        updateFaviconElement(canvas.toDataURL());
      };
      img.crossOrigin = 'anonymous';
      img.src = originalFavicon.href;
    } else {
      // 如果没有原始favicon，显示显示名称首字母
      ctx.fillStyle = color;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const firstLetter = displayName.charAt(0);
      ctx.fillText(firstLetter, 8, 8);
      
      updateFaviconElement(canvas.toDataURL());
    }
  } catch (e) {
    console.log('无法更新favicon:', e);
  }
}

function updateFaviconElement(dataUrl) {
  const head = document.getElementsByTagName('head')[0];
  const oldFavicon = head.querySelector('link[rel="icon"]') || 
                    head.querySelector('link[rel="shortcut icon"]');
  
  const newFavicon = document.createElement('link');
  newFavicon.rel = 'icon';
  newFavicon.type = 'image/png';
  newFavicon.href = dataUrl;
  
  if (oldFavicon) {
    head.removeChild(oldFavicon);
  }
  head.appendChild(newFavicon);
}


// 页面加载完成后立即执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClassifier);
} else {
  initializeClassifier();
}

function initializeClassifier() {
  // 页面加载完成，等待background script发送分类信息
  // 不需要主动请求，background script会自动处理
}