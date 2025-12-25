<template>
  <div
    class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900"
  >
    <!-- 1. 顶部导航栏 -->
    <header class="flex-none sticky top-0 z-20 px-4 py-4 backdrop-blur-md bg-gray-50/80 dark:bg-gray-900/80">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md"
          >
            <Icon icon="carbon:ibm-watson-discovery" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-base font-bold text-gray-900 dark:text-white tracking-tight">InfoFlow</h1>
            <p class="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Daily Insights
            </p>
          </div>
        </div>
        <button class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500">
          <Icon icon="carbon:settings" class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- 2. 消息列表区域 -->
    <main class="flex-1 overflow-y-auto scroll-smooth" ref="scrollContainer">
      <div class="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-36">
        <!-- 空状态/欢迎页 -->
        <div
          v-if="messageList.length === 0"
          class="flex flex-col items-center justify-center h-[60vh] text-center space-y-8 animate-fade-in"
        >
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">今天想了解什么？</h2>
        </div>

        <!-- 消息列表 -->
        <div
          v-for="(msg, index) in messageList"
          :key="index"
          class="group flex w-full gap-4"
          :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
        >
          <!-- 头像 -->
          <div
            class="flex-none w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1"
            :class="
              msg.role === 'assistant'
                ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                : 'bg-blue-600'
            "
          >
            <Icon v-if="msg.role === 'assistant'" icon="carbon:bot" class="w-5 h-5 text-blue-600" />
            <Icon v-else icon="carbon:user" class="w-5 h-5 text-white" />
          </div>

          <!-- 消息内容 -->
          <div class="max-w-[85%]">
            <div
              class="relative px-5 py-3.5 text-[15px] leading-relaxed shadow-sm"
              :class="[
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm'
              ]"
            >
              <div v-if="msg.role === 'user'">
                {{ msg.content }}
              </div>

              <!-- AI 消息 -->
              <div v-else>
                <ClientOnly>
                  <MarkdownRender :content="content" />
                </ClientOnly>
                <!-- 加载动画 -->
                <div v-if="msg.isStreaming" class="flex gap-1.5 mt-3 items-center h-4">
                  <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                  <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                  <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            </div>

            <!-- 工具栏 -->
            <div
              v-if="msg.role === 'assistant' && !msg.isStreaming"
              class="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity px-1"
            >
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="复制">
                <Icon icon="carbon:copy" class="w-4 h-4" />
              </button>
              <button
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="重新生成"
              >
                <Icon icon="carbon:renew" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 3. 底部输入框 -->
    <footer
      class="flex-none fixed bottom-0 left-0 right-0 p-4 sm:pb-8 z-20 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 pointer-events-none"
    >
      <div class="max-w-3xl mx-auto pointer-events-auto">
        <div class="relative group">
          <textarea
            v-model="inputContent"
            @keydown.enter.prevent="handleSend"
            placeholder="问点什么..."
            rows="1"
            class="w-full pl-5 pr-14 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-[15px] transition-all duration-200 ease-in-out"
            style="min-height: 56px; max-height: 200px"
          ></textarea>

          <button
            @click="handleSend"
            :disabled="!inputContent.trim() || isGlobalStreaming"
            class="absolute right-3 bottom-3 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          >
            <Icon v-if="isGlobalStreaming" icon="carbon:stop-filled-alt" class="w-5 h-5 animate-pulse" />
            <Icon v-else icon="carbon:send-alt" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

// --- 类型定义 ---
interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

// --- 状态管理 ---
const inputContent = ref('')
const isGlobalStreaming = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

// 初始为空，展示欢迎页
const messageList = ref<Message[]>([])

const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

const handleSend = async () => {
  const text = inputContent.value.trim()
  if (!text || isGlobalStreaming.value) return

  messageList.value.push({ role: 'user', content: text })
  inputContent.value = ''
  await scrollToBottom()

  isGlobalStreaming.value = true
  const aiMsgIndex =
    messageList.value.push({
      role: 'assistant',
      content: '',
      isStreaming: true
    }) - 1

  // 调用我们自己的后端接口
  await fetchStreamFromNuxtServer(aiMsgIndex)
}

const fetchStreamFromNuxtServer = async (msgIndex: number) => {
  try {
    // 准备历史消息
    const history = messageList.value.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }))

    // 请求 /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })

    if (!response.body) throw new Error('No response body')

    // 读取流
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullContent += chunk

      // 更新 UI
      messageList.value[msgIndex].content = fullContent
      scrollToBottom()
    }
  } catch (e) {
    console.error(e)
    messageList.value[msgIndex].content += '\n[出错了: 请检查 API Key 或网络]'
  } finally {
    messageList.value[msgIndex].isStreaming = false
    isGlobalStreaming.value = false
  }
}
</script>

<style>
/* 隐藏默认滚动条，保持界面极简 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #475569;
}

/* 简单的淡入动画 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
</style>
