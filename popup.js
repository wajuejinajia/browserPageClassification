// 缓存DOM元素
const elements = {
  totalTabs: null,
  totalDomains: null,
  domainList: null,
  groupTabsBtn: null,
  refreshBtn: null
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  // 缓存DOM元素
  elements.totalTabs = document.getElementById('totalTabs');
  elements.totalDomains = document.getElementById('totalDomains');
  elements.domainList = document.getElementById('domainList');
  elements.groupTabsBtn = document.getElementById('groupTabsBtn');
  elements.refreshBtn = document.getElementById('refreshBtn');
  
  loadDomainStats();
  setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
  elements.groupTabsBtn.addEventListener('click', handleGroupTabs);
  elements.refreshBtn.addEventListener('click', handleRefresh);
}

// 处理分组按钮点击
function handleGroupTabs() {
  const btn = elements.groupTabsBtn;
  btn.disabled = true;
  btn.textContent = '正在整理...';
  
  chrome.runtime.sendMessage({ action: 'groupTabsByDomain' }, function(response) {
    if (response && response.success) {
      btn.textContent = '✅ 整理完成';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🏷️ 重新整理分组';
        loadDomainStats(); // 刷新统计
      }, 1500);
    } else {
      btn.textContent = '❌ 整理失败';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🏷️ 重新整理分组';
      }, 1500);
    }
  });
}

// 处理刷新按钮点击
function handleRefresh() {
  const btn = elements.refreshBtn;
  btn.textContent = '🔄 刷新中...';
  btn.disabled = true;
  
  setTimeout(() => {
    loadDomainStats();
    btn.textContent = '✅ 已刷新';
    setTimeout(() => {
      btn.textContent = '🔄 刷新分类';
      btn.disabled = false;
    }, 1000);
  }, 500);
}

// 加载域名统计
function loadDomainStats() {
  chrome.runtime.sendMessage({ action: 'getDomainStats' }, function(response) {
    if (response && response.stats) {
      displayStats(response.stats, response.totalDomains);
    } else {
      showNoTabs();
    }
  });
}

// 显示统计信息
function displayStats(stats, totalDomains) {
  // 计算总标签页数
  const totalTabs = Object.values(stats).reduce((sum, domain) => sum + domain.count, 0);
  
  // 更新统计信息
  elements.totalTabs.textContent = totalTabs;
  elements.totalDomains.textContent = totalDomains;
  
  // 按标签页数量排序
  const sortedDomains = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  
  if (sortedDomains.length === 0) {
    showNoTabs();
    return;
  }
  
  // 使用文档片段提高性能
  const fragment = document.createDocumentFragment();
  
  sortedDomains.forEach(([domain, info]) => {
    const domainElement = createDomainElement(domain, info);
    fragment.appendChild(domainElement);
  });
  
  elements.domainList.innerHTML = '';
  elements.domainList.appendChild(fragment);
  
  // 批量添加事件监听器
  setupDomainEventListeners();
}

// 创建域名元素
function createDomainElement(domain, info) {
  const domainItem = document.createElement('div');
  domainItem.className = 'domain-item';
  
  const isGrouped = info.tabs.some(tab => tab.groupId !== -1);
  const groupStatus = isGrouped ? 
    '<span style="color: #34C759; font-weight: 600;">● 已分组</span>' : 
    '<span style="color: #FF9500; font-weight: 600;">○ 未分组</span>';
  
  const tabsList = info.tabs.map(tab => 
    `<div class="tab-item" data-tab-id="${tab.id}" title="${tab.url}">
      📄 ${truncateText(tab.title, 40)}
    </div>`
  ).join('');
  
  domainItem.innerHTML = `
    <div class="color-indicator" style="background-color: ${info.color}"></div>
    <div class="domain-info">
      <div class="domain-name">${info.displayName || domain}</div>
      <div class="tab-count">
        ${info.count} 个标签页 ${groupStatus}
        <button class="expand-btn" data-domain="${domain}">
          <span class="toggle-text">展开</span>
        </button>
      </div>
      <div class="tab-list" style="display: none;">
        ${tabsList}
      </div>
    </div>
  `;
  
  return domainItem;
}

// 设置域名相关的事件监听器
function setupDomainEventListeners() {
  // 标签页点击事件 - 事件委托
  elements.domainList.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-item') || e.target.closest('.tab-item')) {
      const tabItem = e.target.classList.contains('tab-item') ? e.target : e.target.closest('.tab-item');
      const tabId = parseInt(tabItem.dataset.tabId);
      chrome.tabs.update(tabId, { active: true });
      window.close();
    }
    
    // 展开/收起按钮事件
    if (e.target.classList.contains('expand-btn') || e.target.closest('.expand-btn')) {
      const btn = e.target.classList.contains('expand-btn') ? e.target : e.target.closest('.expand-btn');
      const domain = btn.dataset.domain;
      toggleTabs(domain, btn);
    }
  });
}

// 切换标签页列表显示
function toggleTabs(domain, btn) {
  const tabsList = btn.closest('.domain-item').querySelector('.tab-list');
  const toggleText = btn.querySelector('.toggle-text');
  
  if (tabsList.style.display === 'none') {
    tabsList.style.display = 'block';
    toggleText.textContent = '收起';
  } else {
    tabsList.style.display = 'none';
    toggleText.textContent = '展开';
  }
}

// 截断文本
function truncateText(text, maxLength) {
  return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
}

// 显示无标签页状态
function showNoTabs() {
  elements.domainList.innerHTML = '<div class="no-tabs">没有找到可分类的标签页</div>';
  elements.totalTabs.textContent = '0';
  elements.totalDomains.textContent = '0';
}