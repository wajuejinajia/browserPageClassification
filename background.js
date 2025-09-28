// macOS系统风格颜色列表
const COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', 
  '#FF2D92', '#64D2FF', '#30D158', '#FFCC00', '#BF5AF2',
  '#FF6782', '#40C8E0', '#5AC8FA', '#A2845E', '#8E8E93'
];

// 缓存和状态管理
let domainColorMap = {};
let colorIndex = 0;
let domainCache = new Map(); // 缓存域名解析结果
let groupCache = new Map();  // 缓存分组信息
let pendingUpdates = new Set(); // 防止重复处理

// 初始化
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.sync.get(['domainColorMap', 'colorIndex']);
  domainColorMap = result.domainColorMap || {};
  colorIndex = result.colorIndex || 0;
});

// 优化的域名解析 - 使用缓存
function parseUrl(url) {
  if (domainCache.has(url)) {
    return domainCache.get(url);
  }
  
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // 移除www前缀
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // 提取主域名
    const parts = hostname.split('.');
    let mainDomain = hostname;
    
    if (parts.length >= 2) {
      const commonTLDs = ['com', 'org', 'net', 'edu', 'gov', 'cn', 'jp', 'uk'];
      const lastPart = parts[parts.length - 1];
      
      if (commonTLDs.includes(lastPart)) {
        mainDomain = parts.slice(-2).join('.');
      } else {
        mainDomain = parts.slice(-3).join('.');
      }
    }
    
    const displayName = mainDomain.split('.')[0].toUpperCase();
    
    const result = { mainDomain, displayName };
    
    // 缓存结果，限制缓存大小
    if (domainCache.size > 100) {
      const firstKey = domainCache.keys().next().value;
      domainCache.delete(firstKey);
    }
    domainCache.set(url, result);
    
    return result;
  } catch (e) {
    return null;
  }
}

// 优化的颜色分配 - 批量保存
function assignColorToDomain(domain) {
  if (!domainColorMap[domain]) {
    domainColorMap[domain] = COLORS[colorIndex % COLORS.length];
    colorIndex++;
    
    // 延迟保存，避免频繁写入
    clearTimeout(assignColorToDomain.saveTimer);
    assignColorToDomain.saveTimer = setTimeout(() => {
      chrome.storage.sync.set({ 
        domainColorMap: domainColorMap, 
        colorIndex: colorIndex 
      });
    }, 1000);
  }
  return domainColorMap[domain];
}

// Chrome分组颜色映射
const GROUP_COLORS = {
  '#007AFF': 'blue', '#34C759': 'green', '#FF9500': 'orange',
  '#FF3B30': 'red', '#5856D6': 'purple', '#FF2D92': 'pink',
  '#64D2FF': 'cyan', '#30D158': 'green', '#FFCC00': 'yellow'
};

// 优化的分组函数
async function autoGroupTabsByDomain(mainDomain, displayName, tabs, color) {
  try {
    // 使用缓存的分组信息
    let existingGroups;
    if (groupCache.has('groups')) {
      existingGroups = groupCache.get('groups');
    } else {
      existingGroups = await chrome.tabGroups.query({});
      groupCache.set('groups', existingGroups);
      // 缓存5秒后失效
      setTimeout(() => groupCache.delete('groups'), 5000);
    }
    
    const targetGroup = existingGroups.find(group => 
      group.title.includes(displayName)
    );
    
    if (targetGroup) {
      // 添加到现有分组
      const ungroupedTabs = tabs.filter(tab => tab.groupId === -1);
      if (ungroupedTabs.length > 0) {
        const tabIds = ungroupedTabs.map(tab => tab.id);
        await chrome.tabs.group({ tabIds, groupId: targetGroup.id });
        
        // 获取分组中的实际标签页数量
        const groupTabs = await chrome.tabs.query({ groupId: targetGroup.id });
        await chrome.tabGroups.update(targetGroup.id, {
          title: `${displayName} (${groupTabs.length})`
        });
      }
    } else if (tabs.length > 1) {
      // 创建新分组
      const tabIds = tabs.map(tab => tab.id);
      const groupId = await chrome.tabs.group({ tabIds });
      
      await chrome.tabGroups.update(groupId, {
        title: `${displayName} (${tabs.length})`,
        color: GROUP_COLORS[color] || 'grey',
        collapsed: false
      });
    }
    
    // 清除分组缓存
    groupCache.delete('groups');
  } catch (e) {
    console.log('分组失败:', e);
  }
}

// 防抖处理标签页更新
let updateTimeout;
function debounceTabUpdate(callback, delay = 500) {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(callback, delay);
}

// 更新所有分组标题的函数
async function updateAllGroupTitles() {
  try {
    const groups = await chrome.tabGroups.query({});
    
    for (const group of groups) {
      const groupTabs = await chrome.tabs.query({ groupId: group.id });
      
      // 从分组标题中提取域名
      const titleMatch = group.title.match(/^(.+?)\s*\(/);
      if (titleMatch && groupTabs.length > 0) {
        const displayName = titleMatch[1];
        const currentTitle = `${displayName} (${groupTabs.length})`;
        
        // 只有当标题需要更新时才更新
        if (group.title !== currentTitle) {
          await chrome.tabGroups.update(group.id, {
            title: currentTitle
          });
        }
      }
    }
  } catch (e) {
    console.log('更新分组标题失败:', e);
  }
}

// 定期更新分组标题（每5秒检查一次）
setInterval(updateAllGroupTitles, 5000);

// 监听标签页更新 - 优化版本
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url || pendingUpdates.has(tabId)) {
    return;
  }
  
  const urlInfo = parseUrl(tab.url);
  if (!urlInfo) return;
  
  const { mainDomain, displayName } = urlInfo;
  pendingUpdates.add(tabId);
  
  debounceTabUpdate(async () => {
    try {
      const color = assignColorToDomain(mainDomain);
      
      // 只查询当前窗口的标签页，提高性能
      const windowTabs = await chrome.tabs.query({ currentWindow: true });
      const sameDomainTabs = windowTabs.filter(t => {
        const tabUrlInfo = parseUrl(t.url);
        return tabUrlInfo && tabUrlInfo.mainDomain === mainDomain;
      });
      
      if (sameDomainTabs.length > 1) {
        await autoGroupTabsByDomain(mainDomain, displayName, sameDomainTabs, color);
      }
    } catch (e) {
      console.log('处理标签页更新失败:', e);
    } finally {
      pendingUpdates.delete(tabId);
    }
  });
});

// 监听标签页移除，更新分组标题
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  try {
    // 获取所有分组
    const groups = await chrome.tabGroups.query({});
    
    // 更新每个分组的标题
    for (const group of groups) {
      const groupTabs = await chrome.tabs.query({ groupId: group.id });
      if (groupTabs.length > 0) {
        // 从分组标题中提取域名
        const titleMatch = group.title.match(/^(.+?)\s*\(/);
        if (titleMatch) {
          const displayName = titleMatch[1];
          await chrome.tabGroups.update(group.id, {
            title: `${displayName} (${groupTabs.length})`
          });
        }
      }
    }
  } catch (e) {
    console.log('更新分组标题失败:', e);
  }
});

// 监听标签页分组变化
chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  // 延迟处理，确保分组操作完成
  setTimeout(async () => {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.groupId !== -1) {
        const group = await chrome.tabGroups.get(tab.groupId);
        const groupTabs = await chrome.tabs.query({ groupId: tab.groupId });
        
        // 从分组标题中提取域名
        const titleMatch = group.title.match(/^(.+?)\s*\(/);
        if (titleMatch) {
          const displayName = titleMatch[1];
          await chrome.tabGroups.update(tab.groupId, {
            title: `${displayName} (${groupTabs.length})`
          });
        }
      }
    } catch (e) {
      console.log('处理标签页附加失败:', e);
    }
  }, 100);
});

// 移除不必要的监听器
// chrome.tabs.onActivated 已删除
// chrome.tabs.onCreated 已删除（onUpdated已经处理了）

// 优化的消息处理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDomainStats') {
    chrome.tabs.query({}, (tabs) => {
      const stats = {};
      
      for (const tab of tabs) {
        if (!tab.url) continue;
        
        const urlInfo = parseUrl(tab.url);
        if (!urlInfo) continue;
        
        const { mainDomain, displayName } = urlInfo;
        
        if (!stats[mainDomain]) {
          stats[mainDomain] = {
            count: 0,
            displayName,
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
      
      sendResponse({ stats, totalDomains: Object.keys(stats).length });
    });
    return true;
  }
  
  if (request.action === 'groupTabsByDomain') {
    chrome.tabs.query({}, async (tabs) => {
      const domainGroups = {};
      
      for (const tab of tabs) {
        if (!tab.url) continue;
        
        const urlInfo = parseUrl(tab.url);
        if (!urlInfo) continue;
        
        const { mainDomain } = urlInfo;
        if (!domainGroups[mainDomain]) {
          domainGroups[mainDomain] = [];
        }
        domainGroups[mainDomain].push(tab);
      }
      
      // 并行处理分组
      const groupPromises = Object.entries(domainGroups)
        .filter(([, domainTabs]) => domainTabs.length > 1)
        .map(async ([mainDomain, domainTabs]) => {
          const urlInfo = parseUrl(domainTabs[0].url);
          if (urlInfo) {
            const color = assignColorToDomain(mainDomain);
            return autoGroupTabsByDomain(mainDomain, urlInfo.displayName, domainTabs, color);
          }
        });
      
      try {
        await Promise.all(groupPromises);
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    });
    return true;
  }
});