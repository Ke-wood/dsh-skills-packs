# DSH 技能包

> 把成套的 skill 一次性交给某个子代理，省掉「在任务书里逐个写路径」的负担。

---

## ⚠️ 先说清楚：这些包是「示例 + 本机配置」

本仓库里的 5 个包引用的路径（`D:\plan\...`）是**作者本机**的第三方 skill 仓库位置。
别人 clone 下来**不能直接用**——需要按自己的目录改。

**它的价值在于示范「技能包该怎么写」**，而不是「拿来即用的成品」。

要自己建包：

1. 复制 `_TEMPLATE.md` 改名
2. 改 `_sources.json` 指向你自己的 skill 目录
3. 用面板勾选，或手写 `picks` / `global`
4. `node check-packs.mjs` 校验

---

## 怎么用

在任务书里写一行：

```
技能包：<你的技能包目录>\学术写作.md
先 read 它，按里面的指示加载需要的 skill。
```

子代理 read 这一个文件，就知道：
- 哪些 skill 已经全局可用（直接调名字）
- 哪些需要 read 具体路径
- 哪个源目录还能找到更多

---

## 现有的包

| 包 | 覆盖 | 源 | 点名 | 全局 |
|---|---|---|---|---|
| `学术写作.md` | 起草、润色、引用、审稿回复、综述、配图 | 2 | 5 | 4 |
| `科学计算.md` | 分析+绘图（默认走 sci-figure-kit），再按需找 181 个专业库 | 1 | 0 | 1 |
| `文档办公.md` | Word/Excel/PPT/PDF | 1 | 5 | 0 |
| `文献研究.md` | 找 → 读 → 管 → 写综述 → 跟踪 | 5 | 7 | 1 |
| `方法论.md` | 摸基线、写计划、执行、排错、收尾 | 1 | 7 | 7 |

**分析与绘图的默认入口是本机 `sci-figure-kit`**，不是 `claude-scientific-skills`。

`sci-figure-kit` 已整合三套隔离后端（figkit / R / omicverse），覆盖统计检验、单细胞全流程、
生存分析、富集、期刊风格出图，另有 12 个可装载 mod（配色、顶刊风格、pydeseq2、WGCNA、
clusterProfiler、Prism/SPSS 桥接等）。

**181 个专业库只用于 sci-figure-kit 没覆盖的领域专用需求**（分子对接、材料相图、
医学影像、量子计算、天文等）。

---

## 设计原则

**1. 指针，不是副本**

包文件里写的是**路径**，不是 skill 全文。源目录更新后自动生效，不会静默过期。

复制只在「导出给别人」时做（后续功能）。

**2. 三层引用，不抄清单**

| 写法 | 含义 |
|---|---|
| `global: [名字]` | 已加载（全局或预设内置），直接调名字，不写路径 |
| `picks: [名字]` | 点名，正文里给出路径 |
| `sources: [id]` | 整个源可达，需要时自己按名字找 |

**不把 235 个 skill 逐个写进 `picks`**——那是抄一遍清单，源一更新就过期。

**3. 失败要响亮**

包里的路径若失效（源目录改名/移动），子代理 read 时**立刻报错**。
这比复制一份过期副本、子代理照旧内容干活要好得多。

---

## 文件说明

```
D:\workspace\DSH-skills-packs\
├── README.md          ← 本文件
├── _FORMAT.md         ← 包格式规范
├── _sources.json      ← 源目录注册表（面板扫描用）
├── check-packs.mjs    ← 校验脚本
├── 学术写作.md
├── 科学计算.md
├── 文档办公.md
├── 文献研究.md
└── 方法论.md
```

`_` 开头的是系统文件，不是技能包。

---

## 源目录（实测数字）

| id | 目录 | skill 数 |
|---|---|---|
| `scientific` | `D:\plan\claude-scientific-skills\skills` | **181** |
| `nature` | `D:\plan\nature-skills\skills` | 24 |
| `anthropic` | `D:\plan\anthropic-skills\skills` | 20 |
| `superpowers` | `D:\plan\superpowers\skills` | 15 |
| `dailypaper` | `D:\plan\dailypaper-skills\skills` | 7 |
| `litreview` | `D:\plan\literature-review-skill\skills` | 6 |
| `academic` | `D:\plan\academic-skills` | 5 |
| | **合计** | **258** |

**这些源是第三方项目，会更新、会改名、也会混入非技能目录。**

已知的非技能目录：`dailypaper-skills/skills/_shared`（资源目录，没有 SKILL.md）。

**2026-11-10 更新**：scientific 补入 16 个新 skill（`cantera`、`cellprofiler`、`mageck`、
`nmrglue`、`pybamm`、`relion`、`tellurium`、`qiime2-amplicon` 等）；nature 拉到最新
（新增 `nature-social-science`）；superpowers 到 v7；dailypaper 更新。

---

## 全局 skill 实况

`~/.dsh/skills/` 只有 **12 个**：

```
baseline-survey  dispatching-parallel-agents  executing-plans
lit-review-writing  nature-citation  nature-polishing  nature-writing
sci-figure-kit  subagent-driven-development  systematic-debugging
verification-before-completion  writing-plans
```

另有 **4 个预设内置**（不在用户目录，但 catalog 可见）：
`agent-experience`、`cordis-composition-reference`、`cordis-plugin-development`、
`editing-cordis-compositions`

**注意**：本机**没有** `office` / `office-docx` / `office-xlsx` 系列。
所有 Office 能力都在 `D:\plan\anthropic-skills` 里，需要 read 路径。

---

## 校验

```bash
cd D:\workspace\DSH-skills-packs
node check-packs.mjs
```

检查四件事：
1. frontmatter 合法（`pack` / `description` 必填）
2. `sources` 引用的 id 存在，且目录真的在
3. `picks` 引用的 skill 在声明的源里存在
4. 正文里的 `SKILL.md` 绝对路径都真的存在

---

## 后续

- 面板工作台（`dsh-skill-panel` 插件）读写这些包
- 导出为自包含副本（复制 skill 全文，可分享）
