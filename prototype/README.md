# 地景志：真实摄影视觉原型

这是用于比较视觉方向的临时原型，不是正式 Agent 项目。核心问题：真实风景摄影配合哪些版式和轻量交互，最适合地理图志？

打开 `index.html` 即可使用。也可以在此目录运行 `node server.mjs`，访问 http://127.0.0.1:4178/ 。无第三方依赖。

- `?variant=A`：纸上图鉴，标题、完整摄影、图注与分段解读。
- `?variant=B`：沉浸画卷，以摄影封面建立氛围，点击观察点展开简短解释。
- `?variant=C`：地理展陈，图像与观察目录并列，适合细看。

底部切换器或左右方向键切换方案。添加 `&presentation=1` 隐藏样稿切换器。设置 `NODE_ENV=production` 后服务器会关闭切换器及方案快捷键。

可用交互：照片热点、观察标注开关、完整原图、摄影和资料来源、会话内札记、预置问答。问答未连接模型，札记刷新后清空。

## 摄影

1. `assets/hani-terraces-xiquinhosilva.jpg`：Xiquinho Silva，Hani Rice Terraces，2023-06-23，2560×1709，CC BY 2.0。原图 SHA-1：`497331c7634a5a5f7f86fd21776e1ada400463ef`。
   来源：https://commons.wikimedia.org/wiki/File:Hani_Rice_Terraces_(53696483750).jpg
   许可：https://creativecommons.org/licenses/by/2.0/
2. `assets/yuanyang-terraces-charrine-liu.jpg`：Charrine Liu，The Terrace Of Yuanyang China，2015 年前发布，2048×1365，CC BY-SA 3.0。
   来源：https://commons.wikimedia.org/wiki/File:The_Terrace_Of_Yuanyang_China_(102441505).jpeg
   许可：https://creativecommons.org/licenses/by-sa/3.0/

两个摄影文件均保持下载原样。页面仅根据版式进行显示裁切，并叠加独立网页观察标注；原图可完整查看。第二张摄影及其任何衍生摄影作品继续适用 CC BY-SA 3.0。

## 地理内容

区域机制与人地关系参考 UNESCO World Heritage Centre：
https://whc.unesco.org/en/list/1111/

热点指向照片中的可见局部，不标注未核实的村寨、流向、精确海拔或实测等高线。区域尺度的解释与照片观察分开呈现。

## 当前范围

本原型只验证摄影选择、构图、字体、观察点、阅读节奏及问答入口。它不代表已完成课程要求。后续正式实现仍需保留后端 Agent 循环、真实工具调用、会话记忆、SKILL.md 与启动说明。

尚未选择最终版式，不将临时原型作为正式应用直接发布。
