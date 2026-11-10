#!/usr/bin/env node
/**
 * check-packs.mjs — 校验技能包
 *
 * 检查四件事：
 *   1. 每个包有合法 frontmatter（pack / description 必填）
 *   2. sources 引用的 id 在 _sources.json 里存在，且目录真的在
 *   3. picks 引用的 skill 在对应源里真的存在
 *   4. 正文里出现的所有 SKILL.md 路径都真的存在
 *
 * 用法：
 *   node check-packs.mjs          只报告
 *   node check-packs.mjs --fix    报告并尝试按名字重新定位（不自动改文件）
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const HOME = homedir()

const HERE = dirname(fileURLToPath(import.meta.url))
const SOURCES_FILE = join(HERE, '_sources.json')

/** 解析 frontmatter（只取需要的三种：标量、列表） */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (m === null) return { ok: false, reason: '没有 frontmatter' }
  const out = {}
  let key = null
  for (const raw of m[1].split(/\r?\n/)) {
    if (raw.trim() === '') continue
    const item = raw.match(/^\s+-\s*(.+)$/)
    if (item !== null && key !== null) {
      if (!Array.isArray(out[key])) out[key] = []
      out[key].push(item[1].trim().replace(/^["']|["']$/g, ''))
      continue
    }
    const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (kv !== null) {
      key = kv[1]
      const v = kv[2].trim()
      if (v === '' || v === '[]') out[key] = v === '[]' ? [] : []
      else out[key] = v.replace(/^["']|["']$/g, '')
    }
  }
  return { ok: true, data: out }
}

/** 列出一个源目录下所有真正的 skill 名（含 SKILL.md 的一级子目录） */
function skillsIn(root) {
  if (!existsSync(root)) return null
  const out = new Set()
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (existsSync(join(root, e.name, 'SKILL.md'))) out.add(e.name)
  }
  return out
}

function main() {
  if (!existsSync(SOURCES_FILE)) {
    console.error(`找不到 ${SOURCES_FILE}`)
    process.exit(2)
  }
  const registry = JSON.parse(readFileSync(SOURCES_FILE, 'utf8'))
  const sources = new Map(registry.sources.map((s) => [s.id, s]))

  // 全局 skill 名（~/.dsh/skills + ~/.dsh/skills-manual）
  const GLOBAL_SKILLS = new Set()
  for (const root of [join(HOME, '.dsh', 'skills'), join(HOME, '.dsh', 'skills-manual')]) {
    const set = skillsIn(root)
    if (set !== null) for (const n of set) GLOBAL_SKILLS.add(n)
  }

  // 先把每个源的 skill 名缓存起来
  const cache = new Map()
  const getSkills = (id) => {
    if (!cache.has(id)) {
      const s = sources.get(id)
      cache.set(id, s === undefined ? null : skillsIn(s.root))
    }
    return cache.get(id)
  }

  const errors = []
  const warnings = []

  // 源目录本身是否存在
  for (const s of registry.sources) {
    if (!existsSync(s.root)) {
      errors.push(`源 "${s.id}" 的目录不存在: ${s.root}`)
    } else if (skillsIn(s.root) === null) {
      errors.push(`源 "${s.id}" 不是目录: ${s.root}`)
    } else if (skillsIn(s.root).size === 0) {
      warnings.push(`源 "${s.id}" 下没有任何含 SKILL.md 的子目录: ${s.root}`)
    }
  }

  const packs = readdirSync(HERE).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')

  for (const file of packs) {
    const full = join(HERE, file)
    const text = readFileSync(full, 'utf8')
    const fm = parseFrontmatter(text)

    if (!fm.ok) {
      errors.push(`${file}: ${fm.reason}`)
      continue
    }
    const d = fm.data
    if (typeof d.pack !== 'string' || d.pack === '') errors.push(`${file}: 缺 pack 字段`)
    else if (`${d.pack}.md` !== file) warnings.push(`${file}: pack 名 "${d.pack}" 与文件名不一致`)
    if (typeof d.description !== 'string' || d.description === '') errors.push(`${file}: 缺 description 字段`)

    // sources
    const srcIds = Array.isArray(d.sources) ? d.sources : []
    for (const id of srcIds) {
      if (!sources.has(id)) {
        errors.push(`${file}: sources 里的 "${id}" 不在 _sources.json`)
        continue
      }
      if (getSkills(id) === null) errors.push(`${file}: 源 "${id}" 不可读`)
    }

    // picks 必须在某个声明的源里存在
    const picks = Array.isArray(d.picks) ? d.picks : []
    if (picks.length > 0) {
      const pool = new Set()
      for (const id of srcIds) {
        const set = getSkills(id)
        if (set !== null) for (const n of set) pool.add(n)
      }
      for (const p of picks) {
        if (!pool.has(p)) errors.push(`${file}: picks 里的 "${p}" 不在任何声明的源里`)
      }
    }

    // global 必须在 ~/.dsh/skills 或预设内置里存在
    const glob = Array.isArray(d.global) ? d.global : []
    for (const g of glob) {
      if (!GLOBAL_SKILLS.has(g)) {
        warnings.push(`${file}: global 里的 "${g}" 不在 ~/.dsh/skills（可能是预设内置，请确认）`)
      }
    }

    // 正文里的 SKILL.md 绝对路径必须存在
    // 跳过占位符：含 < > * ? 等通配/模板字符的不是真实路径
    const paths = text.match(/[A-Z]:\\[^\s|`）)]+?\\SKILL\.md/g) ?? []
    for (const p of new Set(paths)) {
      if (/[<>*?]/.test(p)) continue
      if (!existsSync(p)) errors.push(`${file}: 路径不存在 ${p}`)
      else if (!statSync(p).isFile()) errors.push(`${file}: 不是文件 ${p}`)
    }
  }

  // 报告
  console.log(`技能包: ${packs.length} 个`)
  console.log(`源: ${registry.sources.length} 个`)
  if (warnings.length > 0) {
    console.log(`\n警告 ${warnings.length} 条:`)
    for (const w of warnings) console.log(`  ! ${w}`)
  }
  if (errors.length > 0) {
    console.log(`\n错误 ${errors.length} 条:`)
    for (const e of errors) console.log(`  x ${e}`)
    process.exit(1)
  }
  console.log('\n[OK] 全部通过')
}

main()