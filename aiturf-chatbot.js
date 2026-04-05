/**
 * AITurf Chatbot Widget v1.0
 * 
 * Embed on any page with:
 *   <script src="https://your-cdn/aiturf-chatbot.js" 
 *           data-api="https://your-backend.railway.app"
 *           defer></script>
 * 
 * That's it. No dependencies. No framework. Just drop it in.
 */
(function () {
  "use strict";

  // ─── Config ──────────────────────────────────────────────────
  const scriptTag = document.currentScript;
  const API_BASE = (scriptTag && scriptTag.getAttribute("data-api")) || "http://localhost:8000";
  let sessionId = null;
  let isOpen = false;
  let isLoading = false;
  let messages = [];

  // ─── Styles ──────────────────────────────────────────────────
  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

    #aiturf-chat-widget * {
      margin: 0; padding: 0; box-sizing: border-box;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ── Bubble ── */
    #aiturf-chat-bubble {
      position: fixed; bottom: 24px; right: 24px;
      width: 60px; height: 60px;
      background: linear-gradient(135deg, #0ACDBA 0%, #07A89A 100%);
      border-radius: 50%;
      cursor: pointer; z-index: 99998;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 24px rgba(10, 205, 186, 0.35), 0 2px 8px rgba(0,0,0,0.15);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
      animation: aiturf-pulse 3s ease-in-out infinite;
    }
    #aiturf-chat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 32px rgba(10, 205, 186, 0.5), 0 4px 12px rgba(0,0,0,0.2);
    }
    #aiturf-chat-bubble.open {
      animation: none;
      transform: scale(0.9) rotate(90deg);
    }
    @keyframes aiturf-pulse {
      0%, 100% { box-shadow: 0 4px 24px rgba(10, 205, 186, 0.35), 0 2px 8px rgba(0,0,0,0.15); }
      50% { box-shadow: 0 4px 32px rgba(10, 205, 186, 0.55), 0 2px 12px rgba(0,0,0,0.2); }
    }
    #aiturf-chat-bubble svg {
      width: 28px; height: 28px; fill: #0A1628;
      transition: transform 0.3s ease;
    }
    #aiturf-chat-bubble.open svg { transform: rotate(-90deg); }

    /* ── Greeting tooltip ── */
    #aiturf-chat-greeting {
      position: fixed; bottom: 94px; right: 24px;
      background: #0A1628; color: #E8F0F2;
      padding: 12px 18px; border-radius: 12px 12px 4px 12px;
      font-size: 14px; line-height: 1.5;
      max-width: 260px; z-index: 99997;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      opacity: 0; transform: translateY(8px);
      transition: opacity 0.4s ease, transform 0.4s ease;
      pointer-events: none;
    }
    #aiturf-chat-greeting.show {
      opacity: 1; transform: translateY(0); pointer-events: auto;
    }
    #aiturf-chat-greeting .dismiss {
      position: absolute; top: 4px; right: 8px;
      background: none; border: none; color: #6B8A99;
      font-size: 16px; cursor: pointer; line-height: 1;
    }

    /* ── Chat Window ── */
    #aiturf-chat-window {
      position: fixed; bottom: 96px; right: 24px;
      width: 400px; max-width: calc(100vw - 32px);
      height: 560px; max-height: calc(100vh - 120px);
      background: #0B1A2E;
      border: 1px solid rgba(10, 205, 186, 0.15);
      border-radius: 20px;
      z-index: 99999;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(10, 205, 186, 0.08);
      opacity: 0; transform: translateY(20px) scale(0.95);
      transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), 
                  transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }
    #aiturf-chat-window.open {
      opacity: 1; transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* ── Header ── */
    .aiturf-header {
      padding: 18px 20px 14px;
      background: linear-gradient(180deg, #0F2238 0%, #0B1A2E 100%);
      border-bottom: 1px solid rgba(10, 205, 186, 0.1);
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }
    .aiturf-header-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #0ACDBA 0%, #07A89A 100%);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .aiturf-header-icon svg { width: 22px; height: 22px; fill: #0A1628; }
    .aiturf-header-text h3 {
      color: #E8F0F2; font-size: 15px; font-weight: 600;
      letter-spacing: 0.3px;
    }
    .aiturf-header-text span {
      color: #0ACDBA; font-size: 12px; font-weight: 400;
      display: flex; align-items: center; gap: 5px;
    }
    .aiturf-header-text span::before {
      content: ''; width: 6px; height: 6px;
      background: #0ACDBA; border-radius: 50%;
      display: inline-block;
      animation: aiturf-blink 2s ease-in-out infinite;
    }
    @keyframes aiturf-blink {
      0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
    }
    .aiturf-close-btn {
      margin-left: auto; background: none; border: none;
      color: #6B8A99; cursor: pointer; padding: 4px;
      border-radius: 8px; transition: background 0.2s, color 0.2s;
    }
    .aiturf-close-btn:hover { background: rgba(255,255,255,0.06); color: #E8F0F2; }

    /* ── Messages ── */
    .aiturf-messages {
      flex: 1; overflow-y: auto; padding: 16px 16px 8px;
      display: flex; flex-direction: column; gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: rgba(10, 205, 186, 0.2) transparent;
    }
    .aiturf-messages::-webkit-scrollbar { width: 5px; }
    .aiturf-messages::-webkit-scrollbar-track { background: transparent; }
    .aiturf-messages::-webkit-scrollbar-thumb {
      background: rgba(10, 205, 186, 0.2); border-radius: 10px;
    }

    .aiturf-msg {
      max-width: 85%; padding: 12px 16px;
      font-size: 14px; line-height: 1.6;
      animation: aiturf-msg-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes aiturf-msg-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .aiturf-msg.bot {
      background: #122340; color: #D0DEE6;
      border-radius: 4px 16px 16px 16px;
      align-self: flex-start;
      border: 1px solid rgba(10, 205, 186, 0.06);
    }
    .aiturf-msg.user {
      background: linear-gradient(135deg, #0ACDBA 0%, #08B5A5 100%);
      color: #0A1628; font-weight: 500;
      border-radius: 16px 4px 16px 16px;
      align-self: flex-end;
    }
    .aiturf-msg.bot strong { color: #0ACDBA; font-weight: 600; }
    .aiturf-msg.bot em { color: #7EC8C0; }
    .aiturf-msg.bot a { color: #0ACDBA; text-decoration: underline; }
    .aiturf-msg.bot p { margin-bottom: 8px; }
    .aiturf-msg.bot p:last-child { margin-bottom: 0; }
    .aiturf-msg.bot ul, .aiturf-msg.bot ol {
      margin: 6px 0; padding-left: 20px;
    }
    .aiturf-msg.bot li { margin-bottom: 4px; }

    /* ── Typing indicator ── */
    .aiturf-typing {
      display: flex; gap: 5px; padding: 14px 18px;
      background: #122340; border-radius: 4px 16px 16px 16px;
      align-self: flex-start; border: 1px solid rgba(10, 205, 186, 0.06);
    }
    .aiturf-typing span {
      width: 7px; height: 7px; background: #0ACDBA;
      border-radius: 50%; opacity: 0.4;
      animation: aiturf-typing-dot 1.4s ease-in-out infinite;
    }
    .aiturf-typing span:nth-child(2) { animation-delay: 0.2s; }
    .aiturf-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes aiturf-typing-dot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* ── Quick Actions ── */
    .aiturf-quick-actions {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 4px 0 8px;
    }
    .aiturf-quick-btn {
      background: rgba(10, 205, 186, 0.08);
      border: 1px solid rgba(10, 205, 186, 0.2);
      color: #0ACDBA; padding: 8px 14px;
      border-radius: 20px; font-size: 13px;
      cursor: pointer; transition: all 0.2s ease;
      font-family: inherit;
    }
    .aiturf-quick-btn:hover {
      background: rgba(10, 205, 186, 0.15);
      border-color: rgba(10, 205, 186, 0.4);
      transform: translateY(-1px);
    }

    /* ── Input ── */
    .aiturf-input-area {
      padding: 12px 16px 16px;
      background: #0B1A2E;
      border-top: 1px solid rgba(10, 205, 186, 0.08);
      flex-shrink: 0;
    }
    .aiturf-input-row {
      display: flex; gap: 8px; align-items: flex-end;
    }
    .aiturf-input-row textarea {
      flex: 1; background: #122340;
      border: 1px solid rgba(10, 205, 186, 0.12);
      color: #D0DEE6; padding: 10px 14px;
      border-radius: 14px; font-size: 14px;
      resize: none; outline: none;
      min-height: 42px; max-height: 100px;
      line-height: 1.5;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .aiturf-input-row textarea::placeholder { color: #4A6A7A; }
    .aiturf-input-row textarea:focus {
      border-color: rgba(10, 205, 186, 0.35);
    }
    .aiturf-send-btn {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #0ACDBA, #07A89A);
      border: none; border-radius: 12px;
      cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      transition: transform 0.2s, opacity 0.2s;
      flex-shrink: 0;
    }
    .aiturf-send-btn:hover { transform: scale(1.05); }
    .aiturf-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .aiturf-send-btn svg { width: 18px; height: 18px; fill: #0A1628; }

    /* ── Powered by ── */
    .aiturf-powered {
      text-align: center; padding: 6px 0 10px;
      font-size: 11px; color: #3A5568;
      letter-spacing: 0.5px;
    }
    .aiturf-powered a { color: #0ACDBA; text-decoration: none; }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      #aiturf-chat-window {
        bottom: 0; right: 0;
        width: 100vw; height: 100vh;
        max-height: 100vh; max-width: 100vw;
        border-radius: 0;
      }
      #aiturf-chat-bubble { bottom: 16px; right: 16px; }
      #aiturf-chat-greeting { bottom: 86px; right: 16px; }
    }
  `;

  // ─── Icons ───────────────────────────────────────────────────
  const ICON_CHAT = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/></svg>`;
  const ICON_CLOSE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  const ICON_SEND = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
  const ICON_BOT = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;

  // ─── Simple markdown parser ──────────────────────────────────
  function renderMarkdown(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Line breaks → paragraphs
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      // Wrap in p
      .replace(/^(.+)$/, "<p>$1</p>");
  }

  // ─── Build DOM ───────────────────────────────────────────────
  function init() {
    // Inject styles
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    // Container
    const container = document.createElement("div");
    container.id = "aiturf-chat-widget";
    container.innerHTML = `
      <!-- Greeting tooltip -->
      <div id="aiturf-chat-greeting">
        <button class="dismiss" onclick="this.parentElement.classList.remove('show')">&times;</button>
        Hi! I'm AITurf's AI assistant.<br>Ask me anything about AI for your business.
      </div>

      <!-- Chat bubble -->
      <div id="aiturf-chat-bubble">${ICON_CHAT}</div>

      <!-- Chat window -->
      <div id="aiturf-chat-window">
        <div class="aiturf-header">
          <div class="aiturf-header-icon">${ICON_BOT}</div>
          <div class="aiturf-header-text">
            <h3>AITurf AI</h3>
            <span>Powered by AI</span>
          </div>
          <button class="aiturf-close-btn" id="aiturf-close">${ICON_CLOSE}</button>
        </div>
        <div class="aiturf-messages" id="aiturf-messages"></div>
        <div class="aiturf-input-area">
          <div class="aiturf-input-row">
            <textarea id="aiturf-input" rows="1" placeholder="Type your message…"></textarea>
            <button class="aiturf-send-btn" id="aiturf-send">${ICON_SEND}</button>
          </div>
          <div class="aiturf-powered">Built by <a href="https://aiturf.in" target="_blank">AITurf</a> — Educate ✦ Elevate</div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // References
    const bubble = document.getElementById("aiturf-chat-bubble");
    const window_ = document.getElementById("aiturf-chat-window");
    const closeBtn = document.getElementById("aiturf-close");
    const messagesEl = document.getElementById("aiturf-messages");
    const input = document.getElementById("aiturf-input");
    const sendBtn = document.getElementById("aiturf-send");
    const greeting = document.getElementById("aiturf-chat-greeting");

    // Show greeting after 3 seconds
    setTimeout(() => {
      if (!isOpen) greeting.classList.add("show");
    }, 3000);

    // Auto-dismiss greeting after 10 seconds
    setTimeout(() => greeting.classList.remove("show"), 13000);

    // Toggle chat
    function toggleChat() {
      isOpen = !isOpen;
      bubble.classList.toggle("open", isOpen);
      window_.classList.toggle("open", isOpen);
      greeting.classList.remove("show");

      if (isOpen && messages.length === 0) {
        showWelcome();
      }
      if (isOpen) {
        setTimeout(() => input.focus(), 400);
      }
    }

    bubble.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", toggleChat);

    // Welcome message
    function showWelcome() {
      const welcomeText = `Hey! 👋 I'm AITurf's AI assistant.\n\nI can help you explore how AI fits into your business, tell you about our services, or run a quick AI readiness check.\n\nWhat brings you here today?`;
      addBotMessage(welcomeText);
      showQuickActions([
        { label: "Tell me about AITurf", msg: "Tell me about AITurf's services" },
        { label: "AI Readiness Check", msg: "I want to check my business's AI readiness" },
        { label: "I have an AI question", msg: "I have a specific question about AI" },
      ]);
    }

    // Add bot message
    function addBotMessage(text) {
      const div = document.createElement("div");
      div.className = "aiturf-msg bot";
      div.innerHTML = renderMarkdown(text);
      messagesEl.appendChild(div);
      messages.push({ role: "assistant", content: text });
      scrollToBottom();
    }

    // Add user message
    function addUserMessage(text) {
      const div = document.createElement("div");
      div.className = "aiturf-msg user";
      div.textContent = text;
      messagesEl.appendChild(div);
      messages.push({ role: "user", content: text });
      scrollToBottom();
    }

    // Show quick action buttons
    function showQuickActions(actions) {
      const wrapper = document.createElement("div");
      wrapper.className = "aiturf-quick-actions";
      actions.forEach(({ label, msg }) => {
        const btn = document.createElement("button");
        btn.className = "aiturf-quick-btn";
        btn.textContent = label;
        btn.addEventListener("click", () => {
          wrapper.remove();
          sendMessage(msg);
        });
        wrapper.appendChild(btn);
      });
      messagesEl.appendChild(wrapper);
      scrollToBottom();
    }

    // Typing indicator
    function showTyping() {
      const div = document.createElement("div");
      div.className = "aiturf-typing";
      div.id = "aiturf-typing";
      div.innerHTML = "<span></span><span></span><span></span>";
      messagesEl.appendChild(div);
      scrollToBottom();
    }
    function hideTyping() {
      const el = document.getElementById("aiturf-typing");
      if (el) el.remove();
    }

    function scrollToBottom() {
      requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }

    // Send message
    async function sendMessage(text) {
      if (!text.trim() || isLoading) return;
      addUserMessage(text.trim());
      input.value = "";
      input.style.height = "auto";
      isLoading = true;
      sendBtn.disabled = true;
      showTyping();

      try {
        const resp = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), session_id: sessionId }),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        sessionId = data.session_id;
        hideTyping();
        addBotMessage(data.reply);

        // If lead was detected, show a subtle confirmation
        if (data.lead_detected) {
          const note = document.createElement("div");
          note.style.cssText = "text-align:center;font-size:11px;color:#0ACDBA;padding:4px;opacity:0.7;";
          note.textContent = "✓ Contact info noted — Aravinda will follow up soon";
          messagesEl.appendChild(note);
          scrollToBottom();
        }
      } catch (err) {
        hideTyping();
        addBotMessage("Sorry, I'm having trouble connecting right now. You can reach us directly at **aiturflabs@gmail.com** or **+91 94491 14392** on WhatsApp.");
        console.error("AITurf Chatbot Error:", err);
      } finally {
        isLoading = false;
        sendBtn.disabled = false;
      }
    }

    // Event listeners
    sendBtn.addEventListener("click", () => sendMessage(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });
    // Auto-resize textarea
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 100) + "px";
    });
  }

  // ─── Initialize on DOM ready ─────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
