# 快速创建图标的方法

由于系统没有PIL库，你可以用以下方法快速创建图标：

## 方法一：在线生成（推荐）

1. 访问 https://favicon.io/favicon-generator/
2. 输入文字：🏷️ 或者 TC
3. 选择背景色：#007AFF（蓝色）
4. 选择文字颜色：白色
5. 下载生成的图标包
6. 将其中的16x16、48x48、128x128图标重命名为：
   - `icon16.png`
   - `icon48.png` 
   - `icon128.png`
7. 放入 `icons/` 文件夹

## 方法二：使用任意图片

1. 找一个16x16像素的小图片（任何图片都可以）
2. 复制3份，分别命名为：
   - `icons/icon16.png`
   - `icons/icon48.png`
   - `icons/icon128.png`

## 方法三：暂时不使用图标

保持当前的manifest.json（已移除图标引用），扩展仍然可以正常工作，只是没有自定义图标。

## 完成后

记得在manifest.json中重新添加图标配置：

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png", 
  "128": "icons/icon128.png"
}
```