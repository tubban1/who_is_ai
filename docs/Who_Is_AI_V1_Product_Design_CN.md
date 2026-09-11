**WHO IS AI?**

**谁是 AI？— 3D 全球真人图灵测试游戏**

V1 产品与游戏设计文档

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>一句话玩法<br />
</strong>在精美的 3D 世界里遇见陌生人，最多聊 5 轮，然后判断：对方是
HUMAN、AI，还是 NOT SURE。猜对 +1，猜错 -1，不确定 0。</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>30 秒<br />
</strong>理解规则</th>
<th><strong>5 轮<br />
</strong>最长对话</th>
<th><strong>+1 / -1 / 0<br />
</strong>核心计分</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

V1 目标不是做
MMO，也不是做聊天机器人。目标是先验证一个核心问题：**“和一个身份未知的陌生人聊
5 轮并判断其是否为 AI，这件事是否足够让人反复玩？”**

**1. 产品定位**

规则极简，复杂度来自真人与 AI 的行为，而不是技能、装备或数值系统。

- 类型：3D 社交推理 / Human-vs-AI Detection / Global Turing Test。

- 平台：V1 优先桌面浏览器；移动端保留后续兼容空间。

- 单局体验不是“开房间打一局”，而是持续进入世界、不断遇见陌生人、完成短
  Encounter。

- 真人和 AI
  在外观、名字、移动、可用动作和聊天界面上尽量平等，避免明显系统提示泄露身份。

- 每次 Encounter 独立计分，可以连续玩很多次，并累计到全球排行榜。

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>V1 产品原则<br />
</strong>复杂性来自：语言、反应、行为、空间理解、犹豫、欺骗与心理判断。不要通过加入职业、战斗、装备、任务树等机制增加“游戏性”。</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**2. 核心规则**

新玩家应该只需要读 4 行就能开始。

| **规则** | **V1 定义**                                           |
|----------|-------------------------------------------------------|
| **遇见** | 在 3D 世界靠近陌生人，可发起 Talk Encounter。         |
| **对话** | 最多 5 轮；1 轮 = 双方各最多发送 1 条消息。可提前猜。 |
| **判断** | HUMAN / AI / NOT SURE。                               |
| **计分** | 猜对 +1；猜错 -1；不知道 0。                          |

**建议限制：**每条消息 1–250 字符；每轮双方都可发送，也可选择
Skip；第五轮结束强制进入判断。

**3. 玩家核心循环**

| 进入世界 | 自由行走 | 遇见陌生人 | **最多聊 5 轮** | **判断身份** | **揭晓 + 计分** | 继续寻找下一个人 |
|----------|----------|------------|-----------------|--------------|-----------------|------------------|

- Encounter 期间两人进入一个轻量“对话状态”：仍在 3D
  场景中、面对面站立，可小范围移动和做简单动作。

- 任何一方都不能看到对方是真人还是 AI。

- 完成判断后立即 Reveal，不需要等对方做同样选择。

- Reveal 后双方可分开继续探索；同一对玩家短时间内不重复匹配，防止刷分。

**4. V1 世界与地图策略**

第一版建议只做一个主世界，先验证核心玩法；架构为未来 Parallel Worlds
预留。

| **方案**             | **V1**  | **原因**                                                           |
|----------------------|---------|--------------------------------------------------------------------|
| **一个共享地图**     | 采用    | 空间语义一致；开发和同步最简单；容易理解“路上遇到人”。             |
| **多个完全不同地图** | 暂不    | 会增加资产、同步、匹配密度和语言/场景语义问题。                    |
| **Parallel Worlds**  | 预留 V2 | 北京/纽约玩家可使用不同渲染层，却在同一逻辑 Encounter 网络中相遇。 |

**V1 场景建议：**一个精美、国际化、非特定城市的未来都市广场 / 步行街 /
公园组合。既适合各种语言用户，又不会因为“你身后的纽约黄出租车”之类场景差异破坏对话。

**5. 跨语言交流设计**

这是 V1
的核心能力，而不是后期附加功能。不同语言用户应该能自然对话，同时尽量不破坏“判断
AI”的公平性。

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>关键原则<br />
</strong>所有跨语言消息都走同一翻译管线——不论消息来自真人还是
AI。系统保存“原文 +
翻译”，默认显示用户自己的界面语言，同时允许一键查看原文。这样既能交流，也避免只给
AI 或只给真人做翻译而泄露身份。</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**5.1 用户语言设置**

- 首次进入自动检测浏览器语言，但用户可以修改 Preferred Language。

- V1
  建议首发：English、中文（简体/繁体）、Deutsch、Français、Español、Português、日本語、한국어。翻译服务可支持更多语言，但
  UI 首发不必一次做全。

- 语言设置不等于真实国籍/所在地，不作为身份判断提示。

**5.2 消息处理流程**

| **发送原文** | 语言检测 | 统一翻译服务 | 接收方看到译文 | **可点“原文”切换** |
|--------------|----------|--------------|----------------|--------------------|

**示例：**

| **Liang（中文原文）**     | 你刚才为什么一直跟着我？                     |
|---------------------------|----------------------------------------------|
| **María（西语界面看到）** | ¿Por qué me has estado siguiendo?            |
| **María（西语原文）**     | Porque pensé que tú también ibas a la plaza. |
| **Liang（中文界面看到）** | 因为我以为你也要去广场。                     |

**5.3 为什么必须保留原文**

- 机器翻译会“抹平”拼写错误、口语、停顿、语气和非母语表达，而这些可能正是玩家判断
  HUMAN / AI 的线索。

- 因此译文用于“理解”，原文用于“观察”。玩家可以自由切换，但不要求懂对方语言。

- 翻译界面不要出现“由 AI 翻译”等可能影响判断的提示；统一标为 Translated
  / 原文。

**5.4 AI 的语言规则**

- AI 先以自己的 Persona Language
  生成“原始消息”，再与真人消息一样经过相同翻译流程；不要统一先生成英语再翻译，否则风格容易趋同。

- AI
  可拥有不同语言水平：母语、非母语、简短表达、口语化等，但其设定不能通过
  UI 暴露。

- AI
  不允许读取“对方是否真人”的服务端真值，只知道当前聊天内容、可见场景和自身
  Persona。

**5.5 轮数如何计算**

- 翻译不增加轮数。

- 一次 Round = A 最多 1 条 + B 最多 1 条；共最多 5 Round / 10 条主消息。

- 系统提示、翻译切换、表情动作不占对话轮次。

**5.6 V1 不做实时语音翻译**

- V1 只做文字，确保翻译质量、成本和公平性可控。

- V2 可扩展：语音识别 → 保留原音 → 字幕翻译 → 可选
  TTS；但必须同样保证真人与 AI 使用一致的呈现规则。

**6. Encounter：五轮对话与空间行为**

- 靠近陌生人约 2–3 米时出现 “E · TALK”。双方接受后进入 Encounter。

- 界面显示 Round 1/5…5/5，任何一轮都可 GUESS NOW。

- 每轮可以同时使用少量空间动作：Wave、Jump、Point、Sit、Turn、Follow。

- 玩家可以用语言要求对方执行动作，例如“跳两次再坐下”；AI 必须通过受限
  Action API 控制 Avatar 执行，而不是只用文字假装执行。

- AI 能看到有限的当前场景
  Observation，例如附近对象、方向、可执行动作；不能读取整个世界或其他玩家隐藏数据。

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>为什么加入空间动作<br />
</strong>它把测试从“聊天机器人识别”升级为语言 + 反应 + 行为 +
空间理解的多模态图灵测试，同时仍然保持规则极简。</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**7. 计分、UUID 与全球排行榜**

**7.1 主积分**

| **选择**       | **结果** | **分数** |
|----------------|----------|----------|
| **HUMAN / AI** | 猜对     | +1       |
| **HUMAN / AI** | 猜错     | -1       |
| **NOT SURE**   | 不判断   | 0        |

**7.2 排行榜排序**

- 主排序：Score。

- 同分时依次比较：Accuracy → Decision Rate → 有效 Encounter 数。

- 这样保留“不知道 = 0”的简单规则，同时避免通过一直选择 NOT SURE
  来获得虚假的高胜率。

- 排行榜建议至少显示：Rank、Nickname、Score、Accuracy、Decision
  Rate、Encounters。

**7.3 匿名 UUID 账户**

- 首次访问自动生成 UUID v4，并保存到浏览器 localStorage /
  IndexedDB，同时服务端创建匿名 Player 记录。

- 之后同一浏览器自动恢复同一个账户和积分，不强制注册。

- V1 可提供“Recovery Code / 导出 Player
  Key”作为可选备份，避免用户清理浏览器后永久丢失。

- V2 再加入 Google / Apple / Email Claim Account，把匿名 UUID
  绑定正式账号。

**8. 真人 / AI 人口与匹配**

- 玩家永远不知道当前世界中 AI 比例。

- 真实在线人数不足时，服务端动态加入 AI，保证玩家很快能遇见对象。

- AI 不应使用一个统一“机器人口吻”；需要 Persona
  多样性：简短、健谈、幽默、谨慎、非母语、爱用 Emoji、慢思考等。

- 真人和 AI 都使用同样的
  Avatar、昵称格式、打字状态、翻译界面和动作能力。

- 不要用固定 2.0 秒延迟或固定错别字等廉价规则模拟人类；行为差异应来自
  Persona、上下文与决策。

**9. AI Agent 最小架构**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>AgentObservation<br />
- own persona &amp; language<br />
- last conversation turns<br />
- nearby visible objects<br />
- allowed avatar actions<br />
- round number / remaining rounds<br />
<br />
AgentDecision<br />
- message_original<br />
- avatar_action (optional)<br />
- movement_intent (optional)</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

- LLM 只能提出结构化 Decision；服务器验证动作是否合法。

- AI Provider 必须可替换，通过环境变量配置 Base URL、API Key、Model。

- 提供 Mock AI，使没有 API Key 时游戏也能本地运行和测试。

**10. V1 前端体验**

| **界面**     | **要求**                                                 |
|--------------|----------------------------------------------------------|
| **世界 HUD** | 尽量少：当前 Score、Encounter 状态、排行榜入口。         |
| **角色附近** | E · TALK。                                               |
| **对话**     | 轻量气泡 / 面板，不覆盖大部分 3D 画面；显示 Round x/5。  |
| **判断**     | 三个大按钮：HUMAN / AI / NOT SURE。                      |
| **Reveal**   | 大字揭晓、得分动画、对话简要复盘，然后 Return to World。 |

**11. 后端与数据模型（V1）**

- players：uuid、nickname、preferred_language、score、correct、wrong、unknown、encounters、created_at、last_seen。

- world_sessions：世界分片 / shard、场景版本、在线人数。

- encounters：双方
  participant_id/type、start/end、round_count、guess、truth、score_delta。

- messages：encounter_id、sender、original_text、original_language、translated_text、target_language、round。

- leaderboard_stats：可实时计算或缓存；避免客户端直接提交积分。

- 所有 HUMAN/AI 真值、Score 计算和 Encounter
  完成状态必须由服务端权威处理。

**12. 公平性、安全与防刷分**

- 同一 UUID 与同一真人对手在一定冷却期内不重复计分。

- 服务端检测异常高频 Encounter、脚本化发送、固定双人对刷等行为。

- 聊天提供 Block /
  Report；可使用内容审核过滤明显骚扰、仇恨、色情诱导及个人信息索取。

- 默认匿名昵称，不展示真实国家、年龄、性别、IP 或设备信息。

- AI Reveal 必须明确标注为 AI；游戏中的身份隐藏只持续到该 Encounter
  揭晓。

- 排行榜应有最低有效 Encounter 门槛，避免 1/1 的玩家长期占据 Accuracy
  榜首。

**13. V1 范围与明确不做的内容**

| **模块**    | **V1**                       | **后续**                      |
|-------------|------------------------------|-------------------------------|
| **3D 世界** | 1 个高质量共享地图           | 多城市 / Parallel Worlds      |
| **交流**    | 文字 + 自动翻译 + 原文切换   | 实时语音 / 字幕 / TTS         |
| **动作**    | Wave / Jump / Point / Sit 等 | 更复杂物理互动                |
| **身份**    | 真人或 AI                    | AI 是否知道自己是 AI 等元玩法 |
| **账户**    | 匿名 UUID + Recovery         | OAuth / 跨设备                |
| **排行**    | Global Score + Accuracy      | 地区榜 / 模型榜 / 赛季        |
| **社交**    | Encounter 后离开             | 好友 / 组队 / 私聊            |

**14. V1 验收场景**

如果下面这条链路完整可玩，第一版就成立。

1.  中文用户首次进入，无需注册，自动获得 UUID 和匿名昵称。

2.  用户进入共享 3D 世界，用 WASD 行走。

3.  用户遇见一个身份未知的角色并发起 Talk。

4.  对方可能是真人，也可能是服务端 AI；客户端无法知道。

5.  如果对方使用西班牙语，用户默认看到中文翻译，并可点击查看西班牙语原文。

6.  双方最多完成 5 轮对话，并可使用 Jump / Point / Sit 等简单空间动作。

7.  用户在第 3 轮提前选择 AI。

8.  服务端揭晓对方实际为 HUMAN，因此用户 Score -1。

9.  全球排行榜即时更新，UUID 对应的累计成绩写入数据库。

10. 用户关闭浏览器，第二天回来，自动读取相同 UUID 和历史成绩。

11. 用户继续在世界中寻找下一个陌生人。

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>V1 成功标准<br />
</strong>玩家第一次进入后无需阅读长教程；60 秒内完成第一次
Encounter；结束后愿意立刻找下一个陌生人。跨语言用户之间的沟通不需要切换
App，也不会因为翻译机制明显暴露 HUMAN / AI 身份。</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**A. 首版建议观察的数据指标**

| **指标**                      | **意义**                          |
|-------------------------------|-----------------------------------|
| **First Encounter Time**      | 进入世界到第一次开始对话的时间    |
| **Encounter Completion Rate** | 开始后完成判断的比例              |
| **Replay Loop**               | 一次会话平均完成多少个 Encounter  |
| **Decision Rate**             | HUMAN/AI 占全部判断的比例         |
| **Accuracy**                  | 排除 NOT SURE 后的识别准确率      |
| **AI Pass Rate**              | AI 被判断为 HUMAN 的比例          |
| **Human Misclassified Rate**  | 真人被判断为 AI 的比例            |
| **Translation Usage**         | 跨语言 Encounter 比例、原文切换率 |
| **D1 Return**                 | 第二天是否回来继续玩              |

**结论：**第一版只需要证明“短对话 + 身份判断 + 即时揭晓 +
全球累计积分”这个循环足够好玩。3D
世界负责让相遇真实，跨语言翻译负责扩大全球玩家池，AI
负责让世界在任何在线人数下都始终有人可遇见。
