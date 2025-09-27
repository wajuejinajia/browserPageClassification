document.addEventListener('DOMContentLoaded', function() {
  loadDomainStats();
  
  // 添加分组按钮事件监听
  document.getElementById('groupTabsBtn').addEventListener('click', function() {
    const btn = this;
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
  });
  
  // 添加刷新按钮事件监听
  document.getElementById('refreshBtn').addEventListener('click', function() {
    const btn = this;
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
  });
});

function loadDomainStats() {
  chrome.runtime.sendMessage({ action: 'getDomainStats' }, function(response) {
    if (response && response.stats) {
      displayStats(response.stats, response.totalDomains);
    } else {
      showNoTabs();
    }
  });
}

function displayStats(stats, totalDomains) {
  const domainList = document.getElementById('domainList');
  const totalTabsElement = document.getElementById('totalTabs');
  const totalDomainsElement = document.getElementById('totalDomains');
  
  // 计算总标签页数
  let totalTabs = 0;
  Object.values(stats).forEach(domain => {
    totalTabs += domain.count;
  });
  
  // 更新统计信息
  totalTabsElement.textContent = totalTabs;
  totalDomainsElement.textContent = totalDomains;
  
  // 按标签页数量排序
  const sortedDomains = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  
  if (sortedDomains.length === 0) {
    showNoTabs();
    return;
  }
  
  // 生成域名列表HTML
  const html = sortedDomains.map(([domain, info]) => {
    const tabsList = info.tabs.map(tab => 
      `<div class="tab-item" data-tab-id="${tab.id}" title="${tab.url}">
        📄 ${truncateText(tab.title, 40)}
      </div>`
    ).join('');
    
    return `
      <div class="domain-item">
        <div class="color-indicator" style="background-color: ${info.color}"></div>
        <div class="domain-info">
          <div class="domain-name">${domain}</div>
          <div class="tab-count">
            ${info.count} 个标签页
            ${info.tabs.some(tab => tab.groupId !== -1) ? 
              '<span style="color: #34C759; font-weight: 600;">● 已分组</span>' : 
              '<span style="color: #FF9500; font-weight: 600;">○ 未分组</span>'
            }
            <button class="expand-btn" data-domain="${domain}">
              <span id="toggle-${domain}">展开</span>
            </button>
          </div>
          <div class="tab-list" id="tabs-${domain}" style="display: none;">
            ${tabsList}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  domainList.innerHTML = html;
  
  // 添加标签页点击事件
  document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', function() {
      const tabId = parseInt(this.dataset.tabId);
      chrome.tabs.update(tabId, { active: true });
      window.close();
    });
  });
  
  // 添加展开/收起按钮事件
  document.querySelectorAll('.expand-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const domain = this.dataset.domain;
      toggleTabs(domain);
    });
  });
}

function toggleTabs(domain) {
  const tabsList = document.getElementById(`tabs-${domain}`);
  const toggleBtn = document.getElementById(`toggle-${domain}`);
  
  if (tabsList.style.display === 'none') {
    tabsList.style.display = 'block';
    toggleBtn.textContent = '收起';
  } else {
    tabsList.style.display = 'none';
    toggleBtn.textContent = '展开';
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

function showNoTabs() {
  const domainList = document.getElementById('domainList');
  domainList.innerHTML = '<div class="no-tabs">没有找到可分类的标签页</div>';
  
  document.getElementById('totalTabs').textContent = '0';
  document.getElementById('totalDomains').textContent = '0';
}