---
pack: 示例包名
description: 一句话说明这个包覆盖什么任务
sources:
  - your-source-id
picks:
  - some-skill-name
global:
  - already-installed-skill
---

# 示例包名技能包

> 复制本文件改名后使用。下面的结构是推荐写法，按需增删。

本包覆盖：<在这里写这个包管哪些任务>。

## 一、已全局加载（直接调 `skill` 工具，用名字）

这些 skill 已经在 `~/.dsh/skills/` 里，子代理的 catalog 本来就有，**不需要路径**。

| skill | 何时用 |
|---|---|
| `your-skill-a` | 什么场景用它 |
| `your-skill-b` | 什么场景用它 |

## 二、点名 skill（需 read 具体路径）

源根：`<你的源目录绝对路径>`

| skill | 路径 | 何时用 |
|---|---|---|
| `skill-x` | `<源目录>\skill-x\SKILL.md` | 什么场景用它 |
| `skill-y` | `<源目录>\skill-y\SKILL.md` | 什么场景用它 |

## 三、整源可达（不确定用哪个时）

源目录下还有哪些没点名的：

```bash
# 列出该源全部 skill 名字
ls <你的源目录>
```

需要哪个就 read `<源目录>\<名字>\SKILL.md`。

## 四、纪律

- 一次任务**最多加载 2–3 个** skill。加载过多会挤占上下文，且互相矛盾时无法判断。
- 加载后按 skill 的完整指令执行，不要只读摘要就动手。
- 本文件里的路径若报「不存在」，说明源目录改过名/移动过——**立刻停下上报**，不要自己猜新路径。
