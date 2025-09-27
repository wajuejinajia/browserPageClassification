# Chrome 标签页域名分类器

一个Chrome扩展，自动检测和分类不同域名的标签页，用不同颜色标记来帮助你更好地管理浏览器标签。

## 功能特性

- 🎯 **自动域名检测**：自动识别每个标签页的域名
- 🌈 **颜色分类**：为每个域名分配独特的颜色标记
- 📊 **可视化管理**：在popup界面查看所有域名分类统计
- 🔄 **实时更新**：标签页变化时自动更新分类
- 💾 **持久化存储**：记住每个域名的颜色配置

## 🚀 快速安装

### 方法一：直接下载（推荐新手）
1. 点击页面上方绿色的 **"Code"** 按钮
2. 选择 **"Download ZIP"** 下载压缩包
3. 解压到任意文件夹
4. 打开Chrome浏览器，输入 `chrome://extensions/`
5. 开启右上角的 **"开发者模式"** 开关
6. 点击 **"加载已解压的扩展程序"**
7. 选择刚才解压的文件夹

### 方法二：Git克隆
```bash
git clone https://github.com/wajuejinajia/browserPageClassification.git
cd browserPageClassification
```
然后按照上面步骤4-7操作。

> 📖 **详细安装指南**：查看 [INSTALL.md](./INSTALL.md) 获取完整的安装说明和故障排除。

## 生成图标（可选）

如果你想自定义图标，可以运行：

```bash
cd icons
python create_icons.py
```

需要安装PIL库：`pip install Pillow`

## 文件结构

```
chromeEx/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台脚本，处理标签页监听
├── content.js            # 内容脚本，修改页面显示
├── popup.html            # 弹出界面HTML
├── popup.js              # 弹出界面逻辑
├── icons/                # 图标文件夹
│   ├── create_icons.py   # 图标生成脚本
│   ├── icon16.png        # 16x16 图标
│   ├── icon48.png        # 48x48 图标
│   └── icon128.png       # 128x128 图标
└── README.md             # 说明文档
```

## 使用说明

1. **自动分类**：安装后，扩展会自动为不同域名的标签页分配颜色
2. **查看分类**：点击扩展图标，在弹出界面查看所有域名的分类统计
3. **快速跳转**：在弹出界面点击任意标签页条目，快速跳转到对应页面
4. **颜色标记**：每个标签页的标题前会显示对应域名的颜色标记

## 技术实现

- **Manifest V3**：使用最新的Chrome扩展标准
- **Service Worker**：后台监听标签页状态变化
- **Content Scripts**：在页面中注入颜色标记
- **Chrome Storage API**：持久化存储域名-颜色映射关系
- **Chrome Tabs API**：获取和管理标签页信息

## 自定义配置

你可以通过修改 `background.js` 中的 `COLORS` 数组来自定义可用的颜色：

```javascript
const COLORS = [
  '#007AFF', // 系统蓝
  '#34C759', // 系统绿
  '#FF9500', // 系统橙
  // 添加更多macOS系统颜色...
];
```

## 📸 预览效果

### 🎨 macOS风格界面
- 毛玻璃背景效果
- 系统级颜色方案
- 流畅的动画过渡
- SF Pro字体家族

### 🏷️ 智能标记
- 标签页标题前的彩色圆点 ●
- 网站图标右下角的颜色标记
- 页面顶部的渐变信息条

## 🔧 兼容性

- ✅ Chrome 88+ (Manifest V3)
- ✅ Microsoft Edge 88+
- ✅ 其他Chromium内核浏览器
- ❌ Firefox (不同的扩展API)

## 📝 更新日志

### v1.0.0 (2024-09-27)
- 🎉 首次发布
- ✨ 自动域名检测和分类
- 🎨 macOS风格UI设计
- 🌈 15种系统颜色支持
- 📊 实时统计界面

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License