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
  
  // 在浏览器顶部添加持久的域名分类指示器
  addPersistentDomainIndicator(domain, displayName, color, groupInfo);
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

// 添加持久的域名分类指示器 - 直接在浏览器顶部显示
function addPersistentDomainIndicator(domain, displayName, color, groupInfo) {
  // 检查是否已存在指示器
  if (document.getElementById('persistent-domain-indicator')) {
    return;
  }
  
  // 创建样式
  const styleSheet = document.createElement('style');
  styleSheet.id = 'domain-indicator-styles';
  styleSheet.textContent = `
    /* 持久的顶部域名指示器 */
    .persistent-domain-indicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, ${color}40, ${color}, ${color}40);
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      animation: slideDown 0.3s ease-out;
    }
    
    /* 左上角域名标签 */
    .domain-tag {
      position: fixed;
      top: 8px;
      left: 8px;
      background: ${color};
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      font-size: 11px;
      font-weight: 600;
      z-index: 999998;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideInLeft 0.3s ease-out;
      opacity: 0.9;
    }
    
    /* 右上角分组信息 */
    .group-info {
      position: fixed;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid ${color};
      color: #333;
      padding: 4px 8px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      font-size: 11px;
      font-weight: 500;
      z-index: 999998;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      animation: slideInRight 0.3s ease-out;
      opacity: 0.9;
    }
    
    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 0.9; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 0.9; }
    }
  `;
  document.head.appendChild(styleSheet);
  
  // 创建持久的顶部指示条
  const indicator = document.createElement('div');
  indicator.id = 'persistent-domain-indicator';
  indicator.className = 'persistent-domain-indicator';
  document.body.appendChild(indicator);
  
  // 创建域名标签
  const domainTag = document.createElement('div');
  domainTag.className = 'domain-tag';
  domainTag.textContent = displayName;
  document.body.appendChild(domainTag);
  
  // 如果有分组信息，显示分组信息
  if (groupInfo) {
    const groupInfoElement = document.createElement('div');
    groupInfoElement.className = 'group-info';
    groupInfoElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 4px;">
        <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></div>
        <span>${groupInfo.currentIndex}/${groupInfo.totalTabs}</span>
      </div>
    `;
    document.body.appendChild(groupInfoElement);
  }
}

// 页面加载完成后立即执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClassifier);
} else {
  initializeClassifier();
}

function initializeClassifier() {
  // 向background script请求当前页面的颜色信息
  const domain = window.location.hostname;
  if (domain) {
    chrome.runtime.sendMessage({
      action: 'requestColor',
      domain: domain,
      url: window.location.href
    });
  }
}