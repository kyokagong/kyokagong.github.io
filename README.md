# kyokagong.github.io

> **kyokagong** 的个人主页、具身智能与开源项目展示站，以及个人开源电子书库。

访问地址：<https://kyokagong.github.io>

## 🗺 站点结构

```text
.
├── index.html                                  # 个人主页（极简浅色工程师 / 学术风）
├── about/
│   └── index.html                              # About Me（个人简介与工作经历浓缩）
├── projects/                                   # 个人开源与具身智能项目独立子页
│   ├── wammimic/index.html                     # 多种人形机器人的 Loco-manipulation 实现
│   ├── rlinf-humanoid-embodiments/index.html   # 给 RLInf 添加人形机器人本体代码
│   ├── rlinf-algorithms/index.html             # 在 RLInf 上集成 BFM-zero / P-BFM 算法
│   ├── berkeley-humanoid-lite-rlinf/index.html # Berkeley Humanoid Lite × RLInf 全栈实践
│   └── ray-golang/index.html                   # 分布式计算框架 Ray 对 Golang 的支持
├── books/                                      # 个人开源电子书库（深色阅读风）
│   ├── index.html                              # 书库首页
│   ├── agent-dev/                              # 《AGENT开发从入门到精通》（28 章完结）
│   ├── quantum-computing/                      # 《量子计算》（28 章完结）
│   ├── ml-intro/                               # 《机器学习导论》（规划中）
│   └── information-theory/                     # 《信息论基础》（规划中）
└── assets/
    ├── css/
    │   ├── profile.css                         # 个人主页 / 项目页 / About 浅色样式
    │   ├── site.css                            # 书库与跨书导航深色样式
    │   └── book.css                            # 书内章节排版样式
    ├── js/
    │   ├── profile.js                          # 实机图片点击放大 Lightbox
    │   ├── site.js                             # 书库导航高亮与主题
    │   └── book.js                             # 书内交互脚本
    └── img/
        └── robots/                             # 自建人形机器人与实机演示照片
```

## 🚀 个人开源项目

| 项目 | 方向 | 源码 |
|:---|:---|:---|
| [多种人形机器人的 Loco-manipulation 实现](./projects/wammimic/index.html) | Embodied AI / Loco-manipulation | [kyokagong/wammimic](https://github.com/kyokagong/wammimic) |
| [给 RLInf 添加人形机器人本体代码](./projects/rlinf-humanoid-embodiments/index.html) | RLInf / Humanoid | [RLinf (feat/berkerley-humanoid)](https://github.com/kyokagong/RLinf/tree/feat/berkerley-humanoid) |
| [在 RLInf 上集成更多运控算法](./projects/rlinf-algorithms/index.html) | RLInf / BFM-zero / P-BFM | [RLinf (feat/berkerley-humanoid)](https://github.com/kyokagong/RLinf/tree/feat/berkerley-humanoid) |
| [Berkeley Humanoid Lite × RLInf 全栈实践](./projects/berkeley-humanoid-lite-rlinf/index.html) | Humanoid / VLA / Isaac Lab | [RLinf (feat/berkerley-humanoid)](https://github.com/kyokagong/RLinf/tree/feat/berkerley-humanoid) |
| [分布式计算框架 Ray 对 Golang 的支持](./projects/ray-golang/index.html) | Distributed Systems / Ray / Go | [ray (golang)](https://github.com/kyokagong/ray/tree/golang) |

## 📚 个人开源电子书

书库入口：[`/books/`](./books/index.html)

| 书名 | 状态 | 链接 |
|:---|:---|:---|
| AGENT开发从入门到精通 | ✅ 28 / 28 章完结 | [`/books/agent-dev/`](./books/agent-dev/index.html) |
| 量子计算 | ✅ 28 / 28 章完结 | [`/books/quantum-computing/`](./books/quantum-computing/index.html) |
| 机器学习导论 | 📝 规划中 | [`/books/ml-intro/`](./books/ml-intro/index.html) |
| 信息论基础 | 📝 规划中 | [`/books/information-theory/`](./books/information-theory/index.html) |

## 🖥️ 本地预览

```bash
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 📜 License

Apache License 2.0
