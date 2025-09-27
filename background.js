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

// 从URL提取域名 - 改进版本，处理www前缀和子域名
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // 移除www前缀
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (e) {
    return null;
  }
}

// 获取主域名（用于分组）- 将子域名统一到主域名
function getMainDomain(url) {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // 移除www前缀
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // 提取主域名（例如：search.bilibili.com -> bilibili.com）
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // 对于常见的顶级域名，保留最后两部分
      const commonTLDs = ['com', 'org', 'net', 'edu', 'gov', 'cn', 'jp', 'uk'];
      const lastPart = parts[parts.length - 1];
      
      if (commonTLDs.includes(lastPart)) {
        // 保留主域名部分，如 bilibili.com
        return parts.slice(-2).join('.');
      } else {
        // 对于其他情况，保留最后三部分（如 .com.cn）
        return parts.slice(-3).join('.');
      }
    }
    
    return hostname;
  } catch (e) {
    return null;
  }
}

// 获取域名显示名称（用于显示）
function getDomainDisplayName(url) {
  try {
    const mainDomain = getMainDomain(url);
    if (!mainDomain) return null;
    
    // 提取主要部分作为显示名称
    const parts = mainDomain.split('.');
    return parts[0].toUpperCase(); // 如 bilibili.com -> BILIBILI
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

// 监听标签页更新 - 自动分组和分类
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const mainDomain = getMainDomain(tab.url);
    const displayName = getDomainDisplayName(tab.url);
    
    if (mainDomain && displayName) {
      const color = assignColorToDomain(mainDomain);
      
      // 获取同主域名的所有标签页（包括子域名）
      const allTabs = await chrome.tabs.query({});
      const sameDomainTabs = allTabs.filter(t => {
        const tabMainDomain = getMainDomain(t.url);
        return tabMainDomain === mainDomain;
      });
      
      // 自动创建标签页分组（如果有多个相同主域名的标签页）
      if (sameDomainTabs.length > 1) {
        try {
          await autoGroupTabsByDomain(mainDomain, displayName, sameDomainTabs, color);
        } catch (e) {
          console.log('自动分组失败:', e);
        }
      }
      
      // 不再向content script发送消息
      // 只使用Chrome原生标签页分组功能
    }
  }
});

// 监听新标签页创建
chrome.tabs.onCreated.addListener(async (tab) => {
  // 延迟处理，等待URL加载
  setTimeout(async () => {
    if (tab.url) {
      const mainDomain = getMainDomain(tab.url);
      const displayName = getDomainDisplayName(tab.url);
      
      if (mainDomain && displayName) {
        const allTabs = await chrome.tabs.query({});
        const sameDomainTabs = allTabs.filter(t => {
          const tabMainDomain = getMainDomain(t.url);
          return tabMainDomain === mainDomain;
        });
        
        // 如果有多个相同主域名的标签页，自动分组
        if (sameDomainTabs.length > 1) {
          const color = assignColorToDomain(mainDomain);
          try {
            await autoGroupTabsByDomain(mainDomain, displayName, sameDomainTabs, color);
          } catch (e) {
            console.log('新标签页自动分组失败:', e);
          }
        }
      }
    }
  }, 1000);
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

// 自动分组相同域名的标签页
async function autoGroupTabsByDomain(mainDomain, displayName, tabs, color) {
  try {
    // 检查是否已存在该主域名的分组
    const existingGroups = await chrome.tabGroups.query({});
    let targetGroup = existingGroups.find(group => 
      group.title.includes(displayName) || group.title.includes(mainDomain)
    );
    
    if (targetGroup) {
      // 如果分组已存在，将新标签页添加到现有分组
      const ungroupedTabs = tabs.filter(tab => tab.groupId === -1);
      if (ungroupedTabs.length > 0) {
        const tabIds = ungroupedTabs.map(tab => tab.id);
        await chrome.tabs.group({ 
          tabIds: tabIds, 
          groupId: targetGroup.id 
        });
        
        // 更新分组标题显示最新数量
        await chrome.tabGroups.update(targetGroup.id, {
          title: `${displayName} (${tabs.length})`
        });
      }
    } else if (tabs.length > 1) {
      // 创建新的标签页分组
      const tabIds = tabs.map(tab => tab.id);
      const groupId = await chrome.tabs.group({ tabIds: tabIds });
      
      // 设置分组属性，使用显示名称
      await chrome.tabGroups.update(groupId, {
        title: `${displayName} (${tabs.length})`,
        color: getGroupColorFromHex(color),
        collapsed: false
      });
      
      console.log(`已创建 ${displayName} 的标签页分组，包含 ${tabs.length} 个标签页`);
    }
  } catch (e) {
    console.log('自动分组失败:', e);
  }
}

// 手动分组功能（保留原有功能）
async function groupTabsByDomain(mainDomain, displayName, tabs, color) {
  return autoGroupTabsByDomain(mainDomain, displayName, tabs, color);
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
          const mainDomain = getMainDomain(tab.url);
          const displayName = getDomainDisplayName(tab.url);
          
          if (mainDomain && displayName) {
            if (!stats[mainDomain]) {
              stats[mainDomain] = {
                count: 0,
                displayName: displayName,
                color: domainColorMap[mainDomain] || '#CCCCCC',
                tabs: []
              };
            }
            stats[mainDomain].count++;
            stats[mainDomain].tabs.push({
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
          const mainDomain = getMainDomain(tab.url);
          if (mainDomain) {
            if (!domainGroups[mainDomain]) {
              domainGroups[mainDomain] = [];
            }
            domainGroups[mainDomain].push(tab);
          }
        }
      });
      
      // 为每个域名创建分组
      for (const [mainDomain, domainTabs] of Object.entries(domainGroups)) {
        if (domainTabs.length > 1) {
          const displayName = getDomainDisplayName(domainTabs[0].url);
          const color = assignColorToDomain(mainDomain);
          await groupTabsByDomain(mainDomain, displayName, domainTabs, color);
        }
      }
      
      sendResponse({ success: true });
    });
    return true;
  }
});