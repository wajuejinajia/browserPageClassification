// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateTabColor') {
    updateTabTitle(request.domain, request.color, request.groupInfo);
  }
});

// 更新标签页标题，添加域名分类标记
function updateTabTitle(domain, color, groupInfo) {
  const originalTitle = document.title;
  
  // 创建带颜色和数量的域名标识块
  const domainName = domain.split('.')[0].toUpperCase();
  const groupTag = groupInfo ? 
    `[${domainName} ${groupInfo.currentIndex}/${groupInfo.totalTabs}]` : 
    `[${domainName}]`;
  
  // 检查标题是否已经包含域名标记
  if (!originalTitle.includes('[') || !originalTitle.includes(']')) {
    // 在标题前添加域名标记
    document.title = `${groupTag} ${originalTitle}`;
    
    // 更新favicon添加颜色标识
    updateFavicon(color, domain);
  }
  
  // 在页面中添加视觉分类效果
  addVisualClassification(domain, color, groupInfo);
}

// 更新页面图标 - 添加域名颜色边框
function updateFavicon(color, domain) {
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
      // 如果没有原始favicon，显示域名首字母
      ctx.fillStyle = color;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const firstLetter = domain.split('.')[0].charAt(0).toUpperCase();
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

// 添加视觉分类效果 - 模拟标签页分组
function addVisualClassification(domain, color, groupInfo) {
  // 检查是否已存在分类元素
  if (document.getElementById('domain-classifier-elements')) {
    return;
  }
  
  // 创建分类样式
  const styleSheet = document.createElement('style');
  styleSheet.id = 'domain-classifier-elements';
  styleSheet.textContent = `
    /* 页面顶部域名标识条 */
    .domain-classification-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, transparent, ${color}, transparent);
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      animation: slideDown 0.5s ease-out;
    }
    
    /* 左侧域名标识块 */
    .domain-classification-sidebar {
      position: fixed;
      top: 50%;
      left: 0;
      width: 6px;
      height: 60px;
      background: ${color};
      border-radius: 0 8px 8px 0;
      z-index: 9999;
      transform: translateY(-50%);
      box-shadow: 2px 0 8px rgba(0,0,0,0.15);
      animation: slideInLeft 0.5s ease-out;
    }
    
    /* 域名信息浮层 */
    .domain-classification-info {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 12px 16px;
      border-radius: 12px;
      border: 2px solid ${color};
      color: #333;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 600;
      z-index: 9998;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      animation: slideInRight 0.5s ease-out;
      opacity: 0.9;
    }
    
    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideInLeft {
      from { transform: translateY(-50%) translateX(-100%); opacity: 0; }
      to { transform: translateY(-50%) translateX(0); opacity: 1; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 0.9; }
    }
    
    @keyframes fadeOut {
      to { opacity: 0.3; }
    }
  `;
  document.head.appendChild(styleSheet);
  
  // 创建顶部标识条
  const topBar = document.createElement('div');
  topBar.className = 'domain-classification-bar';
  document.body.appendChild(topBar);
  
  // 创建左侧标识块
  const sidebar = document.createElement('div');
  sidebar.className = 'domain-classification-sidebar';
  document.body.appendChild(sidebar);
  
  // 创建域名信息浮层
  const info = document.createElement('div');
  info.className = 'domain-classification-info';
  const groupText = groupInfo ? 
    `${domain} (${groupInfo.currentIndex}/${groupInfo.totalTabs})` : 
    domain;
  
  info.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%;"></div>
      <span>${groupText}</span>
    </div>
  `;
  document.body.appendChild(info);
  
  // 5秒后淡化效果
  setTimeout(() => {
    topBar.style.animation = 'fadeOut 1s ease-out forwards';
    sidebar.style.animation = 'fadeOut 1s ease-out forwards';
    info.style.animation = 'fadeOut 1s ease-out forwards';
  }, 5000);
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