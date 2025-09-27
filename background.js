// macOS系统风格颜色列表
const COLORS = [
  '#007AFF', // 系统蓝
  '#34C759', // 系统绿
  '#FF9500', // 系统橙
  '#FF3B30', // 系统红
  '#5856D6', // 系统紫
  '#FF2D92', // 系统粉
  '#64D2FF', // 系统天蓝
  '#30D158', // 系统薄荷绿
  '#FFCC00', // 系统黄
  '#BF5AF2', // 系统淡紫
  '#FF6782', // 系统珊瑚红
  '#40C8E0', // 系统青蓝
  '#5AC8FA', // 系统浅蓝
  '#A2845E', // 系统棕
  '#8E8E93'  // 系统灰
];

// 存储域名到颜色的映射
let domainColorMap = {};
let colorIndex = 0;

// 初始化：从存储中加载已有的映射
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.sync.get(['domainColorMap', 'colorIndex']);
  domainColorMap = result.domainColorMap || {};
  colorIndex = result.colorIndex || 0;
});

// 从URL提取域名
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// 为域名分配颜色
function assignColorToDomain(domain) {
  if (!domainColorMap[domain]) {
    domainColorMap[domain] = COLORS[colorIndex % COLORS.length];
    colorIndex++;
    
    // 保存到存储
    chrome.storage.sync.set({ 
      domainColorMap: domainColorMap, 
      colorIndex: colorIndex 
    });
  }
  return domainColorMap[domain];
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = getDomainFromUrl(tab.url);
    if (domain) {
      const color = assignColorToDomain(domain);
      
      // 向content script发送颜色信息
      chrome.tabs.sendMessage(tabId, {
        action: 'updateTabColor',
        domain: domain,
        color: color
      }).catch(() => {
        // 忽略错误，可能是页面还没加载完成
      });
    }
  }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    const domain = getDomainFromUrl(tab.url);
    if (domain) {
      const color = assignColorToDomain(domain);
      
      chrome.tabs.sendMessage(activeInfo.tabId, {
        action: 'updateTabColor',
        domain: domain,
        color: color
      }).catch(() => {});
    }
  }
});

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDomainStats') {
    chrome.tabs.query({}, (tabs) => {
      const stats = {};
      
      tabs.forEach(tab => {
        if (tab.url) {
          const domain = getDomainFromUrl(tab.url);
          if (domain) {
            if (!stats[domain]) {
              stats[domain] = {
                count: 0,
                color: domainColorMap[domain] || '#CCCCCC',
                tabs: []
              };
            }
            stats[domain].count++;
            stats[domain].tabs.push({
              id: tab.id,
              title: tab.title,
              url: tab.url
            });
          }
        }
      });
      
      sendResponse({ stats: stats, totalDomains: Object.keys(stats).length });
    });
    return true; // 保持消息通道开启
  }
});