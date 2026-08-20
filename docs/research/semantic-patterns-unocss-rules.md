# `SEMANTIC_PATTERNS` 与 UnoCSS 规则范围核查

> - 核查日期：2026-08-15
> - 更新日期：2026-08-20
> - 本仓库基线：UnoCSS `66.7.5`
> - 资料范围：UnoCSS 官方文档、`unocss/unocss` 官方源码、当前仓库锁定依赖

## 结论摘要

1. UnoCSS 不存在一份跨所有 preset、第三方插件和用户配置的有限“全部
   utility 名称表”。规则既可以是静态字符串，也可以是正则加生成函数；正则、
   theme、任意值和用户自定义规则共同决定了可接受的 class 名，因此名称空间通常
   是无限的。官方的 [Rules 文档](https://unocss.dev/config/rules)明确展示了静态规则
   和动态正则规则。
2. 对某个固定 preset 和版本，可以完整枚举的是 **rule matcher 定义**，权威位置是
   preset 的 `rules/default.ts` 及其引用的分类模块，而不是文档中的示例列表。
3. 官方给使用者查询 Wind3 utility 的入口是
   [Interactive Docs](https://unocss.dev/interactive/) 和源码；
   [Wind3 文档](https://unocss.dev/presets/wind3#rules)也明确这样指引。
   Interactive Docs 是查询工具，不是能证明“全部 class 名”的封闭规范清单。
4. 本仓库的 `SEMANTIC_PATTERNS` 是在 UnoCSS 分析不可用时才启用的本地启发式分类表，
   不是 UnoCSS 官方 taxonomy。官方源码的模块边界可以作为总结依据，但不能直接等同
   于面向用户的排序分组。
5. 现有分组已补齐一批高优先级 matcher，并新增 `table`、`mask`、`divide`、
   `ui-behavior` 四个内建分组。`mask` 覆盖 Wind4 的独立规则模块；另外三个分组解决
   table utility 分散、divide family 割裂和表单/UI 行为混入 interactivity 的问题。
6. Wind3 的 931 个静态 matcher 现已全部被 fallback 分类器覆盖，并由回归测试锁定；
   动态 matcher 和官方 target 语料仍需按 family 持续补充。

## 版本边界

当前仓库直接锁定 `@unocss/core`、`@unocss/config` 和
`@unocss/preset-wind3` `66.7.5`；`preset-mini` `66.7.5` 是 Wind3 的传递依赖，
见 [`pnpm-lock.yaml`](../../pnpm-lock.yaml)。仓库没有锁定 `preset-wind4`，所以：

- Mini/Wind3 的本地计数和验证以已安装的 `66.7.5` 为准。
- Wind4 的结构判断以官方 [`v66.7.5` 源码](https://github.com/unocss/unocss/tree/v66.7.5/packages-presets/preset-wind4)
  为准，不把它表述为本仓库当前运行时依赖。

## “所有规则”在哪里

### 面向使用者的官方入口

- [Official Presets](https://unocss.dev/presets/)：确认官方 preset 的范围，包括
  Mini、Wind3、Wind4、Icons、Typography 等。不同 preset 提供不同规则，因此仅看
  Wind3 不能代表 UnoCSS 生态的全部规则。
- [Interactive Docs](https://unocss.dev/interactive/)：查询默认 preset 中的具体 utility。
- [Playground](https://unocss.dev/play/)：用实际配置验证某个 token 是否生成 CSS。
- [Rules 配置文档](https://unocss.dev/config/rules)：规则模型的权威说明；它明确允许
  用户追加静态和动态规则。

### 面向维护者的权威源码

| Preset | 总表与装配                                                                                                                                                                                                                                        | 组织方式                                                                                                                                                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mini   | [`_rules/default.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/default.ts#L26-L88)、[`index.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/index.ts#L75-L101)   | 从 align、behavior、border、color、decoration、flex、gap、grid、layout、position、ring、shadow、size、spacing、static、svg、transform、transition、typography 等模块导入数组，最后 `flat(1)`。完整模块出口见 [`_rules/index.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/index.ts)。 |
| Wind3  | [`rules/default.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind3/src/rules/default.ts#L24-L117)、[`index.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind3/src/index.ts#L31-L48)   | `_.xxx` 表示复用 Mini 规则，同时插入 animation、background、columns、divide、filters、line-clamp、placeholder、scroll、table、touch-action、view-transition 等 Wind3 规则，再重建有序总表。自有模块见 [`rules/index.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind3/src/rules/index.ts)。         |
| Wind4  | [`rules/default.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind4/src/rules/default.ts#L38-L138)、[`index.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind4/src/index.ts#L152-L187) | 独立整合完整规则集合，不通过 `presetMini()` 继承；有单独的 mask 模块，并将 `gapRules` 标为 experimental。完整模块出口见 [`rules/index.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind4/src/rules/index.ts)。                                                                                       |

Mini 官方文档称它是 Wind3 的子集，只保留更贴近 CSS property 的核心 utilities，
并排除 `container`、`animation`、`gradient` 等较复杂规则，见
[Mini Rules](https://unocss.dev/presets/mini#rules)。Wind4 官方文档称其兼容 Wind3
功能并进一步增强，但也列出了 theme key 和行为差异，见
[Wind4 文档](https://unocss.dev/presets/wind4)。

### 可以枚举什么，不能枚举什么

可以枚举：

- 固定版本中展开后的 rule tuple 数量；
- 每个 tuple 的 matcher 是静态字符串还是正则；
- 每个 matcher 的生成函数、meta、autocomplete 模板和所在源码模块。

不能有限枚举：

- 每个正则 matcher 能接受的所有字符串；
- theme key、任意值、CSS 变量和用户规则展开后的所有 class 名；
- 所有第三方 preset/plugin 的规则。

在本仓库已安装的 `66.7.5` 包上读取公开的 `rules` export，得到：

| Preset         | 展开后 matcher tuple | 静态 matcher | 动态正则 matcher |
| -------------- | -------------------: | -----------: | ---------------: |
| `preset-mini`  |                  803 |          642 |              161 |
| `preset-wind3` |                1,175 |          931 |              244 |

这是 **matcher 数量，不是 utility 名称数量，也不是语义覆盖率**。它可以通过固定版本
的 `@unocss/preset-mini/rules` 和 `@unocss/preset-wind3/rules` export 重现。
Wind4 未列运行时计数，因为它没有被本仓库锁定。

### `SEMANTIC_PATTERNS` 覆盖率审计

“覆盖率”需要分成两个可复现口径：

| 审计对象                              |  命中 |  总数 |   比例 | 含义                               |
| ------------------------------------- | ----: | ----: | -----: | ---------------------------------- |
| Wind3 静态 matcher                    |   931 |   931 |   100% | 对有限字符串 matcher 的精确匹配    |
| Mini 官方 target 语料（去重）         | 1,085 | 1,182 | 91.79% | 对官方代表 utility 样本的前缀匹配  |
| Wind3 + Mini 官方 target 语料（去重） | 1,474 | 1,583 | 93.11% | 对本仓库 preset 基线的代表语法覆盖 |
| Wind4 官方 target 语料（去重）        | 1,603 | 1,738 | 92.23% | 对未安装 Wind4 的前瞻性参考        |

其中 **100% 是静态规则的精确数字，93.11% 更接近实际 fallback 语法覆盖**。
动态正则 matcher 的可接受字符串通常无限，不能给出同等意义的精确百分比。

target 口径严格只统计 `SEMANTIC_PATTERNS`。它没有把另行处理的
`arbitrary-property`、UnoCSS 配置分析得到的 CSS property、shortcut 和 custom group
算作命中，因此不是整个插件的最终识别率。另一方面，“命中某个 pattern”也不保证
分组正确；后续新增宽前缀时仍需单独审计首匹配冲突。

官方仓库的
[`preset-mini-targets.ts`](https://github.com/unocss/unocss/blob/v66.7.5/test/assets/preset-mini-targets.ts)、
[`preset-wind3-targets.ts`](https://github.com/unocss/unocss/blob/v66.7.5/test/assets/preset-wind3-targets.ts) 和
[`preset-wind4-targets.ts`](https://github.com/unocss/unocss/blob/v66.7.5/test/assets/preset-wind4-targets.ts)
是非常有价值的回归样本，但它们包含边界输入和版本差异，不能当作“全部规则表”。

## 与本仓库 `SEMANTIC_PATTERNS` 的关系

本仓库把 fallback 顺序定义为 layout、position、display、table、
flex/grid/alignment、spacing、sizing、typography、background/mask、
border/divide、effects/filters、transform/transition/animation、
ui-behavior/interactivity、icons、svg、accessibility，见
[`wind3.ts`](../../src/features/sort/profiles/wind3.ts) 中冻结的 `wind3@1`
profile。它和 UnoCSS 官方源码的分类有明显交集，但不是一一对应：

- UnoCSS 的源码模块是实现边界，例如 `static.ts` 同时包含 display、contain、cursor、
  typography 和 field sizing；它不是一个适合直接展示给用户的排序组。
- 本仓库的 `SEMANTIC_PATTERNS.findIndex()` 使用首个命中项，见
  [`group-matchers.ts`](../../src/features/sort/group-matchers.ts)。因此 matcher 的顺序也是
  行为的一部分。
- UnoCSS 自己也会用 rule index 对生成 CSS 排序，见
  [`generator.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-engine/core/src/generator.ts#L404-L417)，
  但该顺序服务于规则匹配、级联和 CSS 输出，不能自动解释为本插件希望提供的 class
  语义排序 UX。

只依赖官方资料，无法证明 `SEMANTIC_PATTERNS` 最初是由哪份清单或人工过程总结出来的；
官方没有发布同名分组。可复现的维护方法应是：以各 preset 的 `rules/default.ts` 为结构
来源，以具体规则模块中的 matcher 为事实来源，以官方 target 文件作为回归样本，再用
真实 generator 输出的 CSS property 做歧义消解。

## 修复后的剩余缺口

下面不是凭 Tailwind 文档猜测，而是对照 UnoCSS `v66.7.5` 官方规则模块得到的 family。

### 优先补入现有分组

| 目标组          | 仍未覆盖或待决策的 family 示例                               | 官方依据                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spacing`       | 无数值的紧凑短写，如 `p`、`pb`、`mxy`                        | Mini [`spacing.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/spacing.ts)                                                                                                                                     |
| `typography`    | `ws-*`、`tab-*`、`indent-*`、`word-spacing-*`                | Mini [`typography.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/typography.ts)、Wind3 [`typography.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind3/src/rules/typography.ts) |
| `background`    | `stops-*`、`shape-*` 两个可省略 `bg-gradient-` 的 Wind3 写法 | Wind3 [`background.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind3/src/rules/background.ts)                                                                                                                              |
| `border`        | `b-*` 别名                                                   | Mini [`border.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/border.ts)                                                                                                                                       |
| `effects`       | `op-*`/`op10` opacity 别名                                   | Mini [`color.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/color.ts)                                                                                                                                         |
| `transform`     | `preserve-3d`/`preserve-flat`                                | Mini [`transform.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/transform.ts)                                                                                                                                 |
| `transition`    | `property-*`                                                 | Mini [`transition.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-mini/src/_rules/transition.ts)                                                                                                                               |
| `animation`     | 可省略 `animate-` 的 `keyframes-*`                           | Wind3 [`animation.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind3/src/rules/animation.ts)                                                                                                                                |
| `accessibility` | Wind4 的 `forced-color-adjust-auto/none`                     | Wind4 [`static.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind4/src/rules/static.ts)                                                                                                                                      |

### 已修复的首匹配冲突

`SEMANTIC_PATTERNS` 不是简单的“正则覆盖集合”，而是有优先级的分类器。本次修复包括：

- 将 alignment 的 `content-*` 收窄为明确值，让 `content-empty` 进入 typography、
  `content-visibility-*` 进入 layout。
- 将文本 `break-*` 与分页/多栏 `break-before/inside/after-*` 分开。
- 删除 grid 中不可达的 `columns-*` 分支，明确归入 layout。
- 将全部 `divide-*` 收敛到独立 divide 分组，不再在 spacing 和 border 之间割裂。
- 收紧 display 的 `block`/`inline` 边界，让逻辑尺寸进入 sizing。
- 从 typography 的 `color-*` 别名中排除 `color-scheme-*`，并将它与 `scheme-*`
  官方别名一起归入 ui-behavior。
- 将 `backface-*` 归入 layout，将 case/font-style/font-smoothing/writing-mode/numeric
  families 归入 typography，并将 `image-render-*` 归入 effects。

这些歧义说明：有 UnoCSS analysis 时应优先按生成 CSS property 分类；fallback 正则应
针对明确 token，而不是继续扩大含义重叠的宽前缀。

## 本次新增的分组

按默认顺序和职责：

1. **`table`**：集中 Wind3 独立
   [`table.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind3/src/rules/table.ts)
   中的 table display、border spacing/collapse、caption side、table layout 和 empty
   cells。它位于 display 之后、flex/grid/alignment 之前。
2. **`mask`**：Wind4 有独立、规模较大的
   [`mask.ts`](https://github.com/unocss/unocss/blob/v66.7.5/packages-presets/preset-wind4/src/rules/mask.ts)，
   覆盖 mask image、gradient、position、repeat、size、mode、type、composite 等。
   它与 background 同级，并同时支持 class-name fallback 和 `mask-*` CSS property。
3. **`divide`**：统一容纳方向、宽度、reverse、颜色、opacity 和 border style，允许
   使用者整体移动该 family。对于 `divide-solid` 这类只生成通用 `border-style` 的
   utility，分类器会保留 class-name 提供的更具体语义。
4. **`ui-behavior`**：集中 appearance、accent、caret、field sizing、color scheme 和
   `scheme-*` 官方别名；cursor、pointer、resize、scroll、snap、touch、select 仍留在
   interactivity。

不建议仅为了和源码文件同名而新增 `static`、`behaviors`、`default` 等组；它们是内部
代码组织名，不是清晰的 class 排序语义。`view-transition`、`content-visibility`、
`placeholder` 目前也更适合并入 transition、layout、typography，而非各自增加顶层组。

## 建议的持续验证方式

1. 保持静态 Wind3 matcher 全覆盖测试；升级 UnoCSS 时让 matcher 数量或未分类项的变化
   直接失败，不把 Tailwind 文档当 UnoCSS 的等价规范。
2. 从三个官方 target 文件抽取无 variant 的代表 token，建立“recognized but fallback
   unknown/misgrouped”测试矩阵；明确记录它只是样本覆盖率。
3. 对每个 dynamic matcher 至少生成一个普通值、一个 theme 值、一个 arbitrary value；
   用 generator 返回的 CSS property 验证预期组。
4. 单独测试首匹配冲突，例如 `content-center`、`content-empty`、
   `content-visibility-auto`，不要只统计“是否命中过某个正则”。
5. UnoCSS 升级时 diff 三个 preset 的 `rules/default.ts`、规则模块出口和官方 target
   文件；任何会改变输出的扩充都必须使用新的 profile 或 `orderVersion`，不能修改
   已冻结的 `wind3@1`。
