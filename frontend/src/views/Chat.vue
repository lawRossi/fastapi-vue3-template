<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { SupabaseFunctionClient } from '@/utils/llm'
import { ElMessage } from 'element-plus'

// 路由和用户状态
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const messages = ref<Array<{ id: string; content: string; role: 'user' | 'assistant'; timestamp: Date }>>([])
const userInput = ref('')
const assistantResponse = ref('')
const isLoading = ref(false)
const chatContainerRef = ref<HTMLElement>()

// 计算属性：是否已登录
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userMessage = {
    id: Date.now().toString(),
    content: userInput.value.trim(),
    role: 'user' as const,
    timestamp: new Date(),
  }

  messages.value.push(userMessage)
  userInput.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    isLoading.value = true

    const requestBody = {
      messages: messages.value.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      model: 'glm-4-flash',
      stream: true,
    }

    await SupabaseFunctionClient.invokeStream(requestBody, (chunk: string) => {
      assistantResponse.value += chunk
      nextTick(() => scrollToBottom())
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请重试')
  } finally {
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      content: assistantResponse.value.trim(),
      role: 'assistant' as const,
      timestamp: new Date(),
    }
    messages.value.push(assistantMessage)
    assistantResponse.value = ''
    isLoading.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

// 处理键盘事件
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 检查登录状态
const checkAuth = async () => {
  await userStore.init()
  if (!isLoggedIn.value) {
    router.push('/auth')
    return
  }
}

// 组件挂载
onMounted(async () => {
  await checkAuth()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- 头部 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">
          AI 聊天助手
        </h1>
        <p class="text-gray-600 mt-2">
          与AI进行智能对话
        </p>
      </div>

      <!-- 聊天容器 -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- 消息区域 -->
        <div ref="chatContainerRef" class="h-96 overflow-y-auto p-4 space-y-4">
          <!-- 空状态 -->
          <div v-if="messages.length === 0" class="text-center text-gray-500 py-12">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p>开始您的第一次对话吧！</p>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']"
          >
            <div
              :class="[
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900',
              ]"
            >
              <p class="whitespace-pre-wrap">
                {{ message.content }}
              </p>
              <p :class="['text-xs mt-1', message.role === 'user' ? 'text-primary-100' : 'text-gray-500']">
                {{ message.timestamp.toLocaleTimeString() }}
              </p>
            </div>
          </div>

          <div v-if="assistantResponse" class="flex justify-start">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
              <p class="whitespace-pre-wrap">
                {{ assistantResponse }}
              </p>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="bg-gray-100 px-4 py-2 rounded-lg">
              <div class="flex items-center space-x-2">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s" />
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s" />
                </div>
                <span class="text-gray-500 text-sm">AI回复中...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="border-t border-gray-200 p-4">
          <div class="flex space-x-3">
            <div class="flex-1">
              <textarea
                v-model="userInput"
                placeholder="输入您的问题..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows="1"
                :disabled="isLoading"
                @keydown="handleKeyPress"
              />
            </div>
            <button
              :disabled="!userInput.trim() || isLoading"
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              @click="sendMessage"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              发送
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
