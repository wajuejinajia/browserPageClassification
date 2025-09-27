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
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = getDomainFromUrl(tab.url);
    if (domain) {
      const color = assignColorToDomain(domain);
      
      // 获取同域名的所有标签页进行分组处理
      const allTabs = await chrome.tabs.query({});
      const sameDomainTabs = allTabs.filter(t => {
        const tabDomain = getDomainFromUrl(t.url);
        return tabDomain === domain;
      });
      
      // 为当前标签页发送分类信息
      chrome.tabs.sendMessage(tabId, {
        action: 'updateTabColor',
        domain: domain,
        color: color,
        groupInfo: {
          totalTabs: sameDomainTabs.length,
          currentIndex: sameDomainTabs.findIndex(t => t.id === tabId) + 1
        }
      }).catch(() => {
        // 忽略错误，可能是页面还没加载完成
      });
      
      // 尝试使用Chrome的标签页分组API（如果可用）
      try {
        if (chrome.tabGroups && sameDomainTabs.length > 1) {
          await groupTabsByDomain(domain, sameDomainTabs, color);
        }
      } catch (e) {
        console.log('标签页分组功能不可用:', e);
      }
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

// 尝试使用Chrome标签页分组API
async function groupTabsByDomain(domain, tabs, color) {
  try {
    // 检查是否已存在该域名的分组
    const existingGroups = await chrome.tabGroups.query({});
    let targetGroup = existingGroups.find(group => group.title === domain);
    
    if (!targetGroup && tabs.length > 1) {
      // 创建新的标签页分组
      const tabIds = tabs.map(tab => tab.id);
      const groupId = await chrome.tabs.group({ tabIds: tabIds });
      
      // 设置分组属性
      await chrome.tabGroups.update(groupId, {
        title: domain,
        color: getGroupColorFromHex(color),
        collapsed: false
      });
    }
  } catch (e) {
    console.log('无法创建标签页分组:', e);
  }
}

// 将十六进制颜色转换为Chrome分组颜色
function getGroupColorFromHex(hexColor) {
  const colorMap = {
    '#007AFF': 'blue',
    '#34C759': 'green', 
    '#FF9500': 'orange',
    '#FF3B30': 'red',
    '#5856D6': 'purple',
    '#FF2D92': 'pink',
    '#64D2FF': 'cyan',
    '#30D158': 'green',
    '#FFCC00': 'yellow'
  };
  
  return colorMap[hexColor] || 'grey';
}

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
              url: tab.url,
              groupId: tab.groupId || -1
            });
          }
        }
      });
      
      sendResponse({ stats: stats, totalDomains: Object.keys(stats).length });
    });
    return true; // 保持消息通道开启
  }
  
  if (request.action === 'groupTabsByDomain') {
    // 手动触发域名分组
    chrome.tabs.query({}, async (tabs) => {
      const domainGroups = {};
      
      tabs.forEach(tab => {
        if (tab.url) {
          const domain = getDomainFromUrl(tab.url);
          if (domain) {
            if (!domainGroups[domain]) {
              domainGroups[domain] = [];
            }
            domainGroups[domain].push(tab);
          }
        }
      });
      
      // 为每个域名创建分组
      for (const [domain, domainTabs] of Object.entries(domainGroups)) {
        if (domainTabs.length > 1) {
          const color = assignColorToDomain(domain);
          await groupTabsByDomain(domain, domainTabs, color);
        }
      }
      
      sendResponse({ success: true });
    });
    return true;
  }
});