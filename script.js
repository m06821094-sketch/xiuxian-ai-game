// ========== 游戏状态 ==========
const defaultState = {
  trust: 30,
  memory: 0,
  day: 1,
  location: "青竹峰",
  history: [],
  roundCount: 0,
  lastEventRound: 0,
  dreamTriggered: false,
  ended: false
};

let gameState = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem("xiuxian_state");
    if (saved) {
      return { ...defaultState, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("加载状态失败", e);
  }
  return { ...defaultState };
}

function saveState() {
  try {
    localStorage.setItem("xiuxian_state", JSON.stringify(gameState));
  } catch (e) {
    console.warn("保存状态失败", e);
  }
}

function resetState() {
  gameState = { ...defaultState };
  saveState();
  updateUI();
  document.getElementById("chatMessages").innerHTML = `
    <div class="message system">
      <div class="message-bubble system-bubble">
        青竹峰上，晨雾未散。你睁开眼，发现自己躺在一片竹林之中。<br>
        身旁站着一位白衣女子，正低头看着你。<br>
        「你终于醒了。」她说。
      </div>
    </div>`;
}

// ========== UI 更新 ==========
function updateUI() {
  const trustBar = document.getElementById("trustBar");
  const memoryBar = document.getElementById("memoryBar");
  const trustValue = document.getElementById("trustValue");
  const memoryValue = document.getElementById("memoryValue");
  const dayValue = document.getElementById("dayValue");
  const locationValue = document.getElementById("locationValue");

  trustBar.style.width = Math.min(100, Math.max(0, gameState.trust)) + "%";
  memoryBar.style.width = Math.min(100, Math.max(0, gameState.memory)) + "%";
  trustValue.textContent = gameState.trust;
  memoryValue.textContent = gameState.memory;
  dayValue.textContent = gameState.day;
  locationValue.textContent = gameState.location;

  // 信任值颜色
  if (gameState.trust >= 70) {
    trustBar.style.background = "linear-gradient(90deg, #5a9a5a, #7aba7a)";
  } else if (gameState.trust >= 40) {
    trustBar.style.background = "linear-gradient(90deg, #6a8a4a, #8aaa5a)";
  } else {
    trustBar.style.background = "linear-gradient(90deg, #8a5a4a, #aa7a5a)";
  }
}

// ========== 消息发送 ==========
function addMessage(role, content) {
  const chatMessages = document.getElementById("chatMessages");
  const bubbleClass = role === "player" ? "player-bubble" :
                      role === "system" ? "system-bubble" : "ai-bubble";
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;
  msgDiv.innerHTML = `<div class="message-bubble ${bubbleClass}">${content}</div>`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  gameState.history.push({ role, content });
}

// ========== 配置面板 ==========
const configToggle = document.getElementById("configToggle");
const configPanel = document.getElementById("configPanel");

configToggle.addEventListener("click", () => {
  configPanel.style.display = configPanel.style.display === "none" ? "block" : "none";
});

// 标签切换
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.dataset.mode;
    document.getElementById("openaiConfig").style.display = mode === "openai" ? "block" : "none";
    document.getElementById("ollamaConfig").style.display = mode === "ollama" ? "block" : "none";
  });
});

// 保存配置
document.getElementById("saveConfig").addEventListener("click", () => {
  const activeMode = document.querySelector(".tab-btn.active").dataset.mode;
  const config = {
    mode: activeMode,
    openai: {
      baseUrl: document.getElementById("openaiBaseUrl").value,
      apiKey: document.getElementById("openaiApiKey").value,
      model: document.getElementById("openaiModel").value
    },
    ollama: {
      baseUrl: document.getElementById("ollamaBaseUrl").value,
      model: document.getElementById("ollamaModel").value
    }
  };
  localStorage.setItem("xiuxian_config", JSON.stringify(config));
  alert("配置已保存！");
});

// 加载配置
function loadConfig() {
  try {
    const saved = localStorage.getItem("xiuxian_config");
    if (saved) {
      const config = JSON.parse(saved);
      if (config.openai) {
        document.getElementById("openaiBaseUrl").value = config.openai.baseUrl || "";
        document.getElementById("openaiApiKey").value = config.openai.apiKey || "";
        document.getElementById("openaiModel").value = config.openai.model || "";
      }
      if (config.ollama) {
        document.getElementById("ollamaBaseUrl").value = config.ollama.baseUrl || "http://localhost:11434";
        document.getElementById("ollamaModel").value = config.ollama.model || "";
      }
      if (config.mode) {
        document.querySelectorAll(".tab-btn").forEach(b => {
          b.classList.toggle("active", b.dataset.mode === config.mode);
        });
        document.getElementById("openaiConfig").style.display = config.mode === "openai" ? "block" : "none";
        document.getElementById("ollamaConfig").style.display = config.mode === "ollama" ? "block" : "none";
      }
    }
  } catch (e) {
    console.warn("加载配置失败", e);
  }
}

// ========== 模型路由 ==========
class ModelRouter {
  constructor() {
    this.config = loadConfig();
  }

  async callOpenAI(messages) {
    const { baseUrl, apiKey, model } = this.config.openai || {};
    if (!baseUrl || !apiKey) {
      throw new Error("请先配置 OpenAI 兼容 API");
    }
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "gpt-4",
        messages: messages,
        temperature: 0.8,
        max_tokens: 500
      })
    });
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callOllama(messages) {
    const { baseUrl, model } = this.config.ollama || {};
    if (!baseUrl) {
      throw new Error("请先配置 Ollama");
    }
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "qwen2.5",
        messages: messages,
        stream: false
      })
    });
    if (!response.ok) {
      throw new Error(`Ollama 请求失败: ${response.status}`);
    }
    const data = await response.json();
    return data.message.content;
  }

  async call(messages) {
    const mode = this.config?.mode || "openai";
    if (mode === "ollama") {
      return this.callOllama(messages);
    }
    return this.callOpenAI(messages);
  }
}

const modelRouter = new ModelRouter();

// ========== System Prompt 生成 ==========
function buildSystemPrompt() {
  return `你正在扮演一个修仙对话游戏中的角色「沈青棠」。

当前状态：
- 信任值：${gameState.trust}/100
- 记忆碎片：${gameState.memory}/100
- 天数：${gameState.day}
- 地点：${gameState.location}

角色设定：
沈青棠，白衣女子，在青竹峰救起了昏迷的主角。她性格清冷但内心温柔，似乎隐藏着许多秘密。她对主角的态度会随着信任值变化。

信任值 < 30：警惕、疏离，说话简短
信任值 30-60：有所保留，偶尔透露信息
信任值 60-80：逐渐敞开心扉，分享往事
信任值 80+：完全信任，展现脆弱一面

记忆碎片 ≥ 100：她察觉到主角似乎想起了什么

请用中文回复，保持角色感，回复简洁但有画面感。每次回复不超过100字。`;
}

// ========== 发送消息 ==========
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || gameState.ended) return;

  userInput.value = "";
  sendBtn.disabled = true;

  addMessage("player", text);
  gameState.roundCount++;

  // 构建消息历史
  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...gameState.history.slice(-10) // 保留最近10条
  ];

  try {
    // 超时控制
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await modelRouter.call(messages);
    clearTimeout(timeout);

    addMessage("ai", response);
    gameState.history.push({ role: "assistant", content: response });

    // 信任值联动
    processTrustChange(text, response);

    // 梦境碎片事件
    if (!gameState.ended && Math.random() < 0.2) {
      triggerDreamFragment();
    }

    // 随机事件
    if (gameState.roundCount - gameState.lastEventRound >= 3 + Math.floor(Math.random() * 3)) {
      triggerRandomEvent();
      gameState.lastEventRound = gameState.roundCount;
    }

    updateUI();
    saveState();

  } catch (e) {
    console.error("API 请求失败", e);
    addMessage("system", "⚠️ 请求超时或失败，已切换为规则回复。请检查模型配置。");
    addMessage("ai", "（沈青棠静静地看着你，等待你的下一句话。）");
  }

  sendBtn.disabled = false;
  userInput.focus();
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ========== 信任值联动 ==========
function processTrustChange(playerText, aiResponse) {
  let change = 0;

  // 配合/帮忙 → +5
  if (/帮|好|行|嗯|可以|愿意|来|一起|我帮你|我来/.test(playerText)) {
    change += 5;
  }
  // 拒绝/对抗 → -5
  else if (/不|不要|不行|没兴趣|走开|别管|滚|离开|不想/.test(playerText)) {
    change -= 5;
  }
  // 追问身世 → +3
  else if (/你是谁|你的过去|你从哪来|你叫什么|你的身世|你以前/.test(playerText)) {
    change += 3;
  }
  // 攻击性 → -10
  else if (/杀|死|打|攻击|坏|骗子|妖/.test(playerText)) {
    change -= 10;
  }
  // 默认微小变化
  else {
    change = Math.floor(Math.random() * 3) - 1; // -1 ~ +1
  }

  gameState.trust = Math.min(100, Math.max(0, gameState.trust + change));
  if (change !== 0) {
    addMessage("system", change > 0 ?
      `沈青棠对你的态度似乎有所缓和。（信任值 +${change}）` :
      change < 0 ?
      `沈青棠的眼神变得冷淡了一些。（信任值 ${change}）` :
      ""
    );
  }
}

// ========== 梦境碎片 ==========
function triggerDreamFragment() {
  const fragments = [
    "你突然感到一阵眩晕，脑海中闪过一个模糊的画面——",
    "你做了一个梦，梦里有一个声音在呼唤你……",
    "你的胸口隐隐作痛，似乎想起了什么重要的事。"
  ];
  const fragment = fragments[Math.floor(Math.random() * fragments.length)];

  addMessage("system", `💭 ${fragment}`);

  // 20% 概率 memory +10~20
  if (Math.random() < 0.5) {
    const gain = 10 + Math.floor(Math.random() * 11);
    gameState.memory += gain;
    addMessage("system", `你努力回想，似乎抓住了一些碎片……（记忆碎片 +${gain}）`);
  }

  if (gameState.memory >= 100) {
    addMessage("system", "✨ 你似乎想起了一些什么……");
  }
}

// ========== 随机事件 ==========
function triggerRandomEvent() {
  const events = [
    {
      title: "妖兽嚎叫",
      desc: "远处传来一声低沉的妖兽嚎叫，竹林微微颤动。",
      options: [
        { text: "上前查看", trust: 5, memory: 0 },
        { text: "留在原地不动", trust: -3, memory: 0 },
        { text: "询问沈青棠", trust: 3, memory: 0 }
      ]
    },
    {
      title: "丹药炉异动",
      desc: "不远处的炼丹炉突然冒出异样的光芒。",
      options: [
        { text: "靠近观察", trust: 0, memory: 5 },
        { text: "让沈青棠处理", trust: -2, memory: 0 },
        { text: "远离炼丹炉", trust: 0, memory: 0 }
      ]
    },
    {
      title: "沈青棠受伤归来",
      desc: "沈青棠从山中归来，衣袖上有血迹。",
      options: [
        { text: "关心询问伤势", trust: 8, memory: 0 },
        { text: "询问去了哪里", trust: 2, memory: 3 },
        { text: "保持沉默", trust: -5, memory: 0 }
      ]
    },
    {
      title: "旧物引起既视感",
      desc: "你在竹林中发现了一块刻有奇怪纹路的石头。",
      options: [
        { text: "仔细研究纹路", trust: 0, memory: 10 },
        { text: "交给沈青棠辨认", trust: 3, memory: 5 },
        { text: "放回原处", trust: 0, memory: 0 }
      ]
    }
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  addMessage("system", `📜 【${event.title}】${event.desc}`);

  // 添加事件选项按钮
  const chatMessages = document.getElementById("chatMessages");
  const eventDiv = document.createElement("div");
  eventDiv.className = "message event-options";
  eventDiv.style.marginTop = "8px";

  event.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "event-btn";
    btn.textContent = opt.text;
    btn.style.cssText = `
      display: block; width: 100%; margin: 4px 0; padding: 8px 12px;
      background: #2a3a2a; border: 1px solid #3a5a3a; border-radius: 4px;
      color: #c8d8b8; font-size: 0.85rem; cursor: pointer; font-family: inherit;
    `;
    btn.addEventListener("click", () => {
      gameState.trust = Math.min(100, Math.max(0, gameState.trust + opt.trust));
      gameState.memory = Math.min(100, Math.max(0, gameState.memory + opt.memory));
      addMessage("player", opt.text);
      if (opt.trust !== 0 || opt.memory !== 0) {
        const parts = [];
        if (opt.trust > 0) parts.push(`信任值 +${opt.trust}`);
        if (opt.trust < 0) parts.push(`信任值 ${opt.trust}`);
        if (opt.memory > 0) parts.push(`记忆碎片 +${opt.memory}`);
        if (parts.length > 0) {
          addMessage("system", `（${parts.join("，")}）`);
        }
      }
      eventDiv.remove();
      updateUI();
      saveState();
    });
    eventDiv.appendChild(btn);
  });

  chatMessages.appendChild(eventDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========== 结局系统 ==========
function checkEnding() {
  if (gameState.ended) return;

  let ending = null;
  if (gameState.trust >= 80 && gameState.memory >= 80) {
    ending = { title: "并肩结局", desc: "你与沈青棠并肩而立，共同面对即将到来的风暴。" };
  } else if (gameState.trust >= 80 && gameState.memory < 80) {
    ending = { title: "守护结局", desc: "你选择留在沈青棠身边，守护她直到最后一刻。" };
  } else if (gameState.trust < 80 && gameState.memory >= 80) {
    ending = { title: "孤独飞升", desc: "你记起了前世的一切，却选择独自踏上飞升之路。" };
  } else if (gameState.trust < 50 && gameState.memory < 50) {
    ending = { title: "逃离结局", desc: "你无法再忍受这一切，转身离开了青竹峰。" };
  }

  if (ending) {
    gameState.ended = true;
    saveState();
    addMessage("system", `═══════════════════════`);
    addMessage("system", `🏁 【${ending.title}】`);
    addMessage("system", ending.desc);
    addMessage("system", `═══════════════════════`);
    addMessage("system", "游戏已结束。点击「重置游戏」重新开始。");

    // 禁用输入
    userInput.disabled = true;
    sendBtn.disabled = true;
  }
}

// 定期检查结局
setInterval(checkEnding, 5000);

// ========== 初始化 ==========
updateUI();
loadConfig();
document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("确定要重置游戏吗？所有进度将被清除。")) {
    resetState();
  }
});
