# kyokagong 书库

> 部署在 GitHub Pages 上的多书开源电子书库。

本仓库托管一套持续生长的中文开源教材，主题涵盖前沿物理学、计算机科学与信息科学。

## 📚 当前书目

| 书名 | 状态 | 链接 |
|:---|:---|:---|
| 量子计算 | ✅ 已开放 | [`/books/quantum-computing/`](./books/quantum-computing/index.html) |
| 机器学习导论 | 📝 规划中 | [`/books/ml-intro/`](./books/ml-intro/index.html) |
| 信息论基础 | 📝 规划中 | [`/books/information-theory/`](./books/information-theory/index.html) |

**主站入口**：[`index.html`](./index.html) — 书库首页，可点击导航到任何一本书。

## 🏗 仓库结构

```
.
├── index.html                    ← 站点首页（书库）
├── README.md                     ← 本文件
├── .gitignore
├── assets/                       ← 站点级共享资源
│   ├── css/
│   │   ├── site.css              ← 站点级 + 跨书导航
│   │   └── book.css              ← 书内样式（深色科技风、章节排版）
│   └── js/
│       ├── site.js               ← 站点级 JS（导航高亮、主题）
│       └── book.js               ← 书内 JS（粒子背景、进度条等）
└── books/                        ← 所有书籍的子站点
    ├── quantum-computing/        ← 《量子计算》
    │   ├── index.html
    │   └── chapters/
    │       └── ch01.html
    ├── ml-intro/                 ← 《机器学习导论》（占位）
    │   └── index.html
    └── information-theory/       ← 《信息论基础》（占位）
        └── index.html
```

## 🎨 设计理念

- **统一外观，深色科技风**：所有书籍共享同一套深色配色与字体
- **跨书导航**：每本书的顶部都有一行"书库 · 量子计算 · 机器学习 · 信息论"导航条，读者随时可切换
- **书内细节差异**：每本书通过顶色 (`--book-accent`) 体现学科气质（量子=青紫、ML=粉橙、信息论=青绿）
- **纯静态**：没有构建系统，直接打开 HTML 即可阅读；适合 GitHub Pages 零成本托管

## 🛠 编辑流程

本站由 4 个角色协作维护：

| 角色 | 职责 |
|:---|:---|
| 领班 | 每日规划、进度汇报 |
| 写书人 | 撰写章节内容 |
| 审稿人 | 审阅稿件、提出意见 |
| 网页开发者 | 把书稿转化为网页并部署 |

工作记录保存在另一个仓库（`quantum_mechanics/`，`plans/` 与 `logs/` 目录），
本仓库（`kyokagong.github.io/`）只托管最终对外可见的网站。

## 🚀 本地预览

```bash
# 任意静态服务器即可
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 📜 License

Apache License 2.0
