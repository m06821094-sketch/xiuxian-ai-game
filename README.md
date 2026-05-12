# 修仙AI对话游戏

> 基于《她捡到一片灰烬》的AI驱动修仙对话游戏

## 简介

这是一款沉浸式的修仙题材对话游戏。你在青竹峰醒来，身边是一位神秘的白衣女子——沈青棠。通过对话与她的信任值互动，逐步揭开记忆碎片的秘密，最终走向属于你的结局。

## 游戏特色

- 🎭 **AI驱动剧情** — 接入真实AI模型，每次对话都是独一无二的体验
- 💕 **信任值系统** — 你的选择影响沈青棠对你的态度
- 🧩 **记忆碎片** — 随机触发梦境事件，逐步拼凑前世记忆
- ⚡ **随机事件** — 妖兽嚎叫、丹药炉异动等修仙日常
- 🏁 **多结局** — 4种不同结局，取决于信任值和记忆碎片

## 快速开始

### 1. 本地运行

直接用浏览器打开 `index.html` 即可运行，无需服务器。

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

### 2. 配置AI模型

点击页面右下角的 **⚙️ 模型配置** 按钮，选择以下任一模式：

#### 模式A：OpenAI 兼容 API

支持任意 OpenAI 兼容接口，包括：

| 服务商 | Base URL | 推荐模型 |
|--------|----------|---------|
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-turbo |
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat |
| OpenAI | `https://api.openai.com/v1` | gpt-4 |
| 讯飞星辰 | `https://maas-api.cn-huabei-1.xf-yun.com/v2` | astron-code-latest |

填写你的 **API Key** 和 **Model** 名称即可。

#### 模式B：Ollama 本地模型

如果你本地运行了 Ollama：

1. 确保 Ollama 正在运行：`ollama serve`
2. 拉取模型：`ollama pull qwen2.5`
3. 选择 "Ollama 本地" 标签
4. Base URL 保持默认 `http://localhost:11434`
5. Model 填写 `qwen2.5`（或你拉取的模型名）

### 3. 开始游戏

配置完成后，在输入框输入对话内容，点击发送或按回车键即可开始。

## 游戏系统说明

### 信任值（Trust）

- 初始值：30/100
- 配合/帮忙：+5
- 拒绝/对抗：-5
- 追问身世：+3
- 攻击性言论：-10
- 不同信任值区间，沈青棠的态度会发生变化

### 记忆碎片（Memory）

- 初始值：0/100
- 约20%概率触发梦境事件
- 努力回想可获得 +10~20 记忆碎片
- 记忆 ≥ 100 时触发特殊提示

### 结局条件

| 结局 | 条件 |
|------|------|
| 🤝 并肩结局 | 信任 ≥ 80 且 记忆 ≥ 80 |
| 🛡️ 守护结局 | 信任 ≥ 80 且 记忆 < 80 |
| 🌙 孤独飞升 | 信任 < 80 且 记忆 ≥ 80 |
| 🚪 逃离结局 | 信任 < 50 且 记忆 < 50 |

## 技术栈

- **前端**：纯 HTML + CSS + JavaScript（无框架依赖）
- **状态管理**：localStorage 持久化
- **AI 接入**：OpenAI 兼容 API / Ollama
- **样式**：水墨绿灰金配色，响应式布局

## 开发说明

本项目为前端单页应用，所有逻辑均在浏览器中运行。无需后端服务器。

如需自定义 System Prompt 或修改游戏逻辑，可直接编辑 `script.js` 中的 `buildSystemPrompt()` 函数。

## License

MIT
