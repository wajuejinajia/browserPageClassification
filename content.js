// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateTabColor') {
    updateTabTitle(request.domain, request.color);
  }
});

// 更新标签页标题，添加颜色标记 - 使用更优雅的圆点
function updateTabTitle(domain, color) {
  // 创建圆点标记
  const colorDot = `●`;
  
  // 更新页面标题
  const originalTitle = document.title;
  
  // 检查标题是否已经包含颜色标记
  if (!originalTitle.includes('●')) {
    document.title = `● ${originalTitle}`;
    
    // 同时更新favicon
    updateFavicon(color);
  }
  
  // 在页面顶部添加域名分类信息条
  addDomainInfoBar(domain, color);
}

// 更新页面图标 - macOS风格圆点
function updateFavicon(color) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 16;
    canvas.height = 16;
    
    // 先绘制原始favicon作为背景
    const originalFavicon = document.querySelector('link[rel="icon"]') || 
                           document.querySelector('link[rel="shortcut icon"]');
    
    if (originalFavicon) {
      const img = new Image();
      img.onload = () => {
        // 绘制原始图标
        ctx.drawImage(img, 0, 0, 16, 16);
        
        // 在右下角绘制彩色圆点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(12, 12, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // 添加白色边框使圆点更突出
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 更新favicon
        updateFaviconElement(canvas.toDataURL());
      };
      img.crossOrigin = 'anonymous';
      img.src = originalFavicon.href;
    } else {
      // 如果没有原始favicon，创建一个简洁的圆点图标
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 16, 16);
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, 2 * Math.PI);
      ctx.fill();
      
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

// 添加域名信息条 - macOS风格
function addDomainInfoBar(domain, color) {
  // 检查是否已存在信息条
  if (document.getElementById('domain-classifier-bar')) {
    return;
  }
  
  const infoBar = document.createElement('div');
  infoBar.id = 'domain-classifier-bar';
  infoBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${color}00, ${color}, ${color}00);
    z-index: 10000;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    animation: slideDown 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `;
  
  // 添加CSS动画
  if (!document.getElementById('domain-classifier-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'domain-classifier-styles';
    styleSheet.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0.2;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  document.body.appendChild(infoBar);
  
  // 3秒后优雅淡出
  setTimeout(() => {
    if (infoBar) {
      infoBar.style.animation = 'fadeOut 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      infoBar.style.opacity = '0.2';
    }
  }, 3000);
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