# kyokagong.github.io 个人主页重构设计规格

- **日期**：2026-11-21
- **目标**：将 `kyokagong.github.io` 根主页重构为突出个人开源与具身智能工作的极简学术/工程师风格个人主页，将原有自写开源电子书库完整迁移至 `/books/` 子页并保持双向导航，同时新增 5 个项目独立子页与 `About Me` 子页。

## 1. 站点架构与路由

```text
.
├── index.html                                  # 新个人主页（极简浅色工程师/学术风）
├── about/
│   └── index.html                              # About Me（浓缩个人简介与工作经历）
├── projects/
│   ├── wammimic/index.html                     # 多种人形机器人的 Loco-manipulation 实现
│   ├── rlinf-humanoid-embodiments/index.html   # 给 RLinf 添加人形机器人本体代码
│   ├── rlinf-algorithms/index.html             # 在 RLInf 上集成 BFM-zero / P-BFM 算法
│   ├── berkeley-humanoid-lite-rlinf/index.html # Berkeley Humanoid Lite × RLInf 全栈实践
│   └── ray-golang/index.html                   # 分布式计算框架 Ray 对 Golang 的支持
├── books/
│   ├── index.html                              # 原首页书库完整迁移至此（保留深色风格）
│   ├── agent-dev/                              # 保留原有路径与内容，更新顶栏导航
│   ├── quantum-computing/                      # 同上
│   ├── ml-intro/                               # 同上
│   └── information-theory/                     # 同上
└── assets/
    ├── css/
    │   ├── profile.css                         # 新增：个人主页 / 项目页 / About 页浅色样式
    │   ├── site.css                            # 保留：书库与跨书导航深色样式
    │   └── book.css                            # 保留：书内阅读样式
    ├── js/
    │   ├── profile.js                          # 新增：图片点击放大 Lightbox 交互
    │   └── site.js                             # 保留：书库导航高亮与主题持久化
    └── img/
        └── robots/
            ├── humanoid-build-1.jpg            # 自建人形机器人实机照 1
            ├── humanoid-build-2.jpg            # 自建人形机器人实机照 2
            └── qiyuan-q1-dance.jpg             # 启元 Q1 跳 G1 舞蹈（优化 JPEG）
```

## 2. 书库无损迁移与双向导航

- **原主页迁移**：将原 `index.html` 迁移至 `books/index.html`，调整相对路径：
  - `assets/css/site.css` → `../assets/css/site.css`
  - `assets/js/site.js` → `../assets/js/site.js`
  - `books/<slug>/index.html` → `<slug>/index.html`
  - 在 `books/index.html` 顶部导航增加 `← 个人主页`（指向 `../index.html`）以及 `About`（指向 `../about/index.html`）。
- **书内顶栏导航修正**：
  - `books/<book>/index.html`（4 个文件）：`site-nav-home`（`📚 书库`）由 `../../index.html` 改为 `../index.html`，并在其左侧增加 `🏠 主页` 指向 `../../index.html`。
  - `books/<book>/chapters/*.html`（全部章节页）：`site-nav-home`（`📚 书库`）保持 `../../index.html`（准确指向 `books/index.html`），并在其左侧增加 `🏠 主页` 指向 `../../../index.html`。
- **URL 兼容性**：既有 `/books/agent-dev/`、`/books/quantum-computing/` 等路径 100% 保持不变。

## 3. 视觉设计与内容规范

### 3.1 视觉系统（`assets/css/profile.css`）
- **定位**：极简浅色工程师 / 学术主页风，与深色科技风书库完全解耦，不共享 `site.css` / `book.css`。
- **色彩**：
  - 背景 `--bg: #fafafa`
  - 表面 `--surface: #ffffff`
  - 细边框 `--border: #e5e7eb`
  - 主文本 `--text: #111827`，次文本 `--text-muted: #4b5563`，辅助元信息 `--text-subtle: #6b7280`
  - 强调色 `--accent: #1d4ed8`（hover `#1e40af`），浅底标签 `--accent-soft: #eff6ff`
- **字体**：`Inter`, `Noto Sans SC` 正文；`JetBrains Mono` 用于时间、标签、代码与仓库路径。
- **扩展组件**：预置 `.figure-grid`（图集）、`.media-frame`（视频/GIF 容器）、`.spec-table`（实验/参数表）、`.note-box`（提示框），便于后续直接补充项目材料。

### 3.2 个人主页（`index.html`）
1. **顶栏**：`kyokagong`（回首页），右侧 `项目`、`个人电子书`（`/books/`）、`About`（`/about/`）、`GitHub`。
2. **Hero Intro**：名字、一句话定位（具身智能与 AI 基础设施工程师）、简洁自述、操作入口（`GitHub`、`Email`、`个人开源电子书 →`、`About Me →`）。
3. **开源与具身智能项目（5 项）**：
   1. `wammimic`（2026.09 – 至今）：多种人形机器人的 Loco-manipulation 实现 — `https://github.com/kyokagong/wammimic`
   2. `rlinf-humanoid-embodiments`（2026.10 – 至今）：给 RLInf 添加人形机器人本体代码 — `https://github.com/kyokagong/RLinf/tree/feat/berkerley-humanoid`
   3. `rlinf-algorithms`（2026.09 – 至今）：在 RLInf 上集成 BFM-zero / P-BFM 算法 — `https://github.com/kyokagong/RLinf/tree/feat/berkerley-humanoid`
   4. `berkeley-humanoid-lite-rlinf`（2025.10 – 至今）：Berkeley Humanoid Lite × RLInf 人形机器人 VLA / 强化学习全栈实践 — `https://github.com/kyokagong/RLinf/tree/feat/berkerley-humanoid`
   5. `ray-golang`（2024.07 – 2024.09）：分布式计算框架 Ray 对 Golang 的支持 — `https://github.com/kyokagong/ray/tree/golang`
   - 每项均展示时间、标签、核心亮点摘要、「查看详情 →」与「GitHub ↗」。
4. **实机进展（Hardware Gallery）**：3 列图集展示自建人形机器人（×2）与启元 Q1 跳 G1 舞蹈（×1），支持点击放大预览并附对应项目跳转。
5. **个人开源电子书**：横向亮点卡片突出个人创作的两本已完结前沿学科教材（《AGENT开发从入门到精通》28 章、《量子计算》28 章）与规划书目，提供「进入书库」及单书直达链接。

### 3.3 项目子页（`projects/<slug>/index.html`）
- 统一结构：面包屑 → 标题/时间/标签/GitHub 按钮 → 项目概述 → 核心工作要点 → 实机展示或后续扩展素材占位区（附 HTML 注释模板）→ 上下篇项目导航。
- 实机图嵌入：`berkeley-humanoid-lite-rlinf` 嵌入 2 张自建人形机器人照片，`rlinf-humanoid-embodiments` 嵌入启元 Q1 跳舞照。

### 3.4 About Me（`about/index.html`）
- **个人简介**：十年 AI 平台研发演进 + 鹅厂早期推广和实践 Ray 经历 + 对 AI、分布式计算与机器人的热爱。
- **工作经历（浓缩时间线）**：
  - `2024.09 – 至今` 深涌智能 · 研发总监（主导 K8s 容器云智算平台、ENOVA 多云异构调度、智能体开发平台、AlphaDojo 与 DimensityProfiler 等从 0 到 1 架构设计与核心研发）
  - `2018.01 – 2024.09` 腾讯计算机系统有限公司 · 高级开发（T10）（核心参与 Game AIR / Avatar 大规模分布式强化学习平台、美术资产分布式处理与 DCC 平台、AIOps / ModelFlow 机器学习平台；获 2 次 5 星优秀员工、2 次 4 星员工）
  - `2016.03 – 2017.12` 广州时代数据服务有限公司 · 算法工程师（负责说话人分割算法落地、基于 Spark 的云端机器学习平台后端及大数据治理平台）
  - `2015.03 – 2016.03` 中兴软创科技股份有限公司 · 数据挖掘工程师（数据挖掘与平台研发）
- **技术栈**：开发语言、具身智能、大数据/AI/大模型、云原生与 Web 框架。
- **教育背景与兴趣**：中山大学理学硕士（心理统计方向）、广州大学理学学士（应用心理）；小提琴、网球、羽毛球。
- **隐私边界**：仅公开 GitHub 与邮箱 `kyokagong@hotmail.com`，不展示手机号与出生日期。

## 4. 验证标准

- 所有 HTML 页面在本地 HTTP 服务下可正常访问，零 404 内部链接与静态资源。
- 所有 3 张实机图片成功加载且点击放大 Lightbox 正常工作。
- 5 个项目的 GitHub 链接与最新简历完全一致。
- 原 `books/` 下书籍与章节页样式和链接完整无损，双向跳转准确。
- 桌面端与移动端无横向滚动条、无布局溢出。
