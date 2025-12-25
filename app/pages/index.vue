<template>
  <div class="chat-container">
    <!-- 1. 顶部导航 -->
    <header class="chat-header">
      <div class="header-content">
        <div class="logo-area">
          <div class="logo-icon">
            <Icon icon="carbon:ibm-watson-discovery" />
          </div>
          <div class="logo-text">
            <h1>InfoFlow</h1>
            <p>Daily Insights</p>
          </div>
        </div>
        <button class="settings-btn">
          <Icon icon="carbon:settings" />
        </button>
      </div>
    </header>

    <!-- 2. 消息列表 -->
    <main class="chat-main" ref="scrollContainer">
      <div class="message-list">
        <!-- 空状态 -->
        <div v-if="messageList.length === 0" class="empty-state">
          <Icon icon="carbon:idea" class="empty-icon" />
          <h2>今天想了解什么？</h2>
        </div>

        <!-- 消息项 -->
        <div v-for="(msg, index) in messageList" :key="index" class="message-item" :class="msg.role">
          <div class="avatar">
            <Icon v-if="msg.role === 'assistant'" icon="carbon:bot" />
            <Icon v-else icon="carbon:user" />
          </div>

          <div class="message-content-wrapper">
            <div class="message-bubble">
              <div v-if="msg.role === 'user'" class="text-content">
                {{ msg.content }}
              </div>
              <div v-else class="markdown-content">
                <MarkdownRenderer :content="msg.content" />
                <span v-if="msg.isStreaming" class="cursor">|</span>
              </div>
            </div>

            <!-- 底部工具栏 -->
            <div v-if="msg.role === 'assistant' && !msg.isStreaming" class="message-actions">
              <button title="复制"><Icon icon="carbon:copy" /></button>
              <button title="重试"><Icon icon="carbon:renew" /></button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 3. 底部输入框 -->
    <footer class="chat-footer">
      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            v-model="inputContent"
            @keydown.enter.prevent="handleSend"
            placeholder="输入问题..."
            rows="1"
          ></textarea>
          <button @click="handleSend" :disabled="!inputContent.trim() || isGlobalStreaming" class="send-btn">
            <Icon v-if="isGlobalStreaming" icon="carbon:stop-filled-alt" />
            <Icon v-else icon="carbon:send-alt" />
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import MarkdownRenderer from '~/components/MarkdownRenderer.vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

const inputContent = ref('')
const isGlobalStreaming = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const messageList = ref<Message[]>([])

// --- 核心：平滑流式打字机逻辑 ---
// pendingQueue 存储已接收但未显示的字符
const pendingQueue = ref('')
let typewriterTimer: number | null = null

const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

const handleSend = async () => {
  const text = inputContent.value.trim()
  if (!text || isGlobalStreaming.value) return

  // 1. 添加用户消息
  messageList.value.push({ role: 'user', content: text })
  inputContent.value = ''
  await scrollToBottom()

  // 2. 添加 AI 占位消息
  isGlobalStreaming.value = true
  const aiMsgIndex =
    messageList.value.push({
      role: 'assistant',
      content: '',
      isStreaming: true
    }) - 1

  // 3. 重置缓冲区
  pendingQueue.value = ''

  // 4. 开始请求
  await fetchStreamFromNuxtServer(aiMsgIndex)
}

const fetchStreamFromNuxtServer = async (msgIndex: number) => {
  try {
    const history = messageList.value.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }))

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })

    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // 启动打字机循环
    startTypewriter(msgIndex)

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })

      // 关键点：将新数据追加到待处理队列，而不是直接显示
      pendingQueue.value += chunk
    }
  } catch (e) {
    console.error(e)
    messageList.value[msgIndex].content += '\n[出错了]'
  } finally {
    // 确保队列中的剩余内容全部显示
    await flushTypewriter(msgIndex)
    messageList.value[msgIndex].isStreaming = false
    isGlobalStreaming.value = false
  }
}

// 优化的打字机逻辑
const startTypewriter = (msgIndex: number) => {
  const type = () => {
    // 如果队列有内容，进行消费
    if (pendingQueue.value.length > 0) {
      // 动态计算本帧渲染字符数：
      // 1. 基础速度：1个字符
      // 2. 加速因子：如果积压太多，按比例增加渲染量，确保不会永远落后
      // 例如：积压 60 个字，每帧渲染 1 + 1 = 2 个字
      //      积压 300 个字，每帧渲染 1 + 5 = 6 个字
      const queueLen = pendingQueue.value.length
      const charsToRender = 1 + Math.floor(queueLen / 30)

      const chunk = pendingQueue.value.slice(0, charsToRender)
      messageList.value[msgIndex].content += chunk
      pendingQueue.value = pendingQueue.value.slice(charsToRender)

      scrollToBottom()
    }

    // 只要还在流式传输，或者队列里还有东西，就继续循环
    if (isGlobalStreaming.value || pendingQueue.value.length > 0) {
      typewriterTimer = requestAnimationFrame(type)
    }
  }

  type()
}

const flushTypewriter = async (msgIndex: number) => {
  if (typewriterTimer) cancelAnimationFrame(typewriterTimer)
  // 立即显示剩余所有内容
  if (pendingQueue.value) {
    messageList.value[msgIndex].content += pendingQueue.value
    pendingQueue.value = ''
    await scrollToBottom()
  }
}
</script>

<style lang="scss">
/* 3. 全局滚动锁定 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden; /* 禁止 body 滚动 */
}
</style>

<style lang="scss" scoped>
/* 变量定义 */
$bg-color: #ffffff;
$bg-color-dark: #111111;
$msg-bg-user: #d2f9d1;
$msg-bg-ai: #f7f7f8;
$msg-bg-ai-dark: #444654;
$border-color: #d1d5db; /* 加深边框颜色，原为 #e5e7eb */
$border-color-dark: #333333;
$primary-color: #10a37f;

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 占满视口 */
  background-color: $bg-color;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden; /* 防止容器溢出 */
}

/* 1. Header */
.chat-header {
  flex: none;
  padding: 1rem;
  border-bottom: 1px solid $border-color;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;

  .header-content {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 10px;

    .logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }

    .logo-text {
      h1 {
        font-size: 16px;
        font-weight: bold;
        margin: 0;
      }
      p {
        font-size: 10px;
        color: #666;
        margin: 0;
        text-transform: uppercase;
      }
    }
  }

  .settings-btn {
    padding: 8px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #666;
    &:hover {
      background-color: #f0f0f0;
    }
  }
}

/* 2. Main */
.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0 120px;

  /* 优化滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  &:hover::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .message-list {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: #333;

  .empty-icon {
    font-size: 48px;
    color: $primary-color;
    margin-bottom: 16px;
  }
}

.message-item {
  display: flex;
  gap: 16px;

  &.user {
    flex-direction: row-reverse;

    .message-bubble {
      background-color: $msg-bg-user;
      border-radius: 12px 12px 2px 12px;
    }

    .avatar {
      background-color: #a1dc95;
    }
  }

  &.assistant {
    .message-bubble {
      background-color: $msg-bg-ai;
      border-radius: 12px 12px 12px 2px;
    }

    .avatar {
      background-color: white;
      border: 1px solid $border-color;
      color: $primary-color;
    }
  }
}

.avatar {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.message-content-wrapper {
  max-width: 85%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-item.user .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .text-content {
    white-space: pre-wrap;
  }
}

.cursor {
  display: inline-block;
  width: 6px;
  height: 18px;
  background-color: $primary-color;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.2s;

  button {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 14px;
    &:hover {
      color: #666;
    }
  }
}

.message-item:hover .message-actions {
  opacity: 1;
}

/* 3. Footer */
.chat-footer {
  flex: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(to top, $bg-color 80%, transparent);
  pointer-events: none;

  .input-area {
    max-width: 800px;
    margin: 0 auto;
    pointer-events: auto;
  }

  .input-wrapper {
    position: relative;
    background: white;
    border: 1px solid #c0c4cc; /* 显式加深边框 */
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus-within {
      border-color: $primary-color;
      box-shadow: 0 4px 16px rgba(16, 163, 127, 0.15);
    }

    textarea {
      width: 100%;
      padding: 14px 50px 14px 16px;
      border: none;
      background: transparent;
      resize: none;
      outline: none;
      font-size: 15px;
      max-height: 200px;
      min-height: 52px;
      box-sizing: border-box;
    }

    .send-btn {
      position: absolute;
      right: 8px;
      bottom: 8px;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background-color: $primary-color;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background-color: darken($primary-color, 5%);
      }
      &:disabled {
        background-color: #e5e7eb;
        color: #999;
        cursor: not-allowed;
      }
    }
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .chat-container {
    background-color: $bg-color-dark;
    color: #eee;
  }
  .chat-header {
    background-color: rgba(17, 17, 17, 0.8);
    border-bottom-color: $border-color-dark;
  }
  .chat-header .logo-text h1 {
    color: #eee;
  }

  .message-item.assistant .message-bubble {
    background-color: $msg-bg-ai-dark;
  }
  .message-item.assistant .avatar {
    background-color: $bg-color-dark;
    border-color: $border-color-dark;
  }

  .chat-footer {
    background: linear-gradient(to top, $bg-color-dark 80%, transparent);
  }
  .chat-footer .input-wrapper {
    background-color: #2d2d2d;
    border-color: #444;
  }
  .chat-footer .input-wrapper textarea {
    color: #eee;
  }
}
</style>
