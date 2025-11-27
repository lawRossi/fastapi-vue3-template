<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { usePresence } from '@/utils/usePresence'
import { type UserInfo } from '@/api/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
let presenceHook: any = null

interface ChatMessage {
  id: string
  username: string
  content: string
  timestamp: Date
  userId: string
  avatar?: string
}

const messages = ref<ChatMessage[]>([])
const userInput = ref('')
const chatContainerRef = ref<HTMLElement>()
const userInfo = ref<UserInfo | null>(null)
const isLoading = ref(true)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const roomName = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('room') || 'general'
})

const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const sendMessage = async () => {
  if (!userInput.value.trim() || !presenceHook.isConnected.value || !userInfo.value) {
    return
  }

  const messageData = {
    id: generateId(),
    username: userInfo.value?.name,
    content: userInput.value.trim(),
    userId: userInfo.value?.id,
    avatar: userInfo.value?.avatar,
    timestamp: new Date().toISOString(),
  }

  console.log('发送消息:', messageData)

  try {
    // 立即显示消息到界面上
    const immediateMessage = {
      ...messageData,
      timestamp: new Date(messageData.timestamp),
    }
    messages.value.push(immediateMessage)
    nextTick(() => scrollToBottom())
    userInput.value = ''

    // 然后发送广播
    await presenceHook.roomChannel.value?.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: messageData,
    })
    console.log("消息已发送")
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请重试')
    
    // 发送失败时移除已显示的消息
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.id === messageData.id) {
      messages.value.pop()
    }
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleUserInput = () => {
  console.log('用户正在输入')
}

const handleMessage = (payload: any) => {
  const message = payload.payload as Omit<ChatMessage, 'timestamp'> & { timestamp: string }
  console.log(message)
  // 检查消息是否已存在（避免重复显示）
  const existingMessageIndex = messages.value.findIndex(m => m.id === message.id)
  if (existingMessageIndex === -1) {
    messages.value.push({
      ...message,
      timestamp: new Date(message.timestamp),
    })
    nextTick(() => scrollToBottom())
  } else {
    console.log('消息已存在，跳过重复添加:', message.id)
  }
}

const initializePresence = () => {
  if (!userInfo.value) {
    console.log('用户信息未加载')
    return
  }
  const broadcastCallbacks = new Map<string, (payload: any) => void>()
  broadcastCallbacks.set('chat_message', handleMessage)

  presenceHook = usePresence({
    userId: userInfo.value.id,
    roomId: roomName.value,
    name: userInfo.value.name,
    avatar: userInfo.value.avatar,
    initialStatus: 'online',
    broadcastCallbacks: broadcastCallbacks
  })
}

const joinRoom = () => {
  try {
    if (!userStore.userId) {
      ElMessage.error('请先登录')
      return
    }

    if (!presenceHook) {
      initializePresence()
    }

    console.log(presenceHook.roomChannel.value)
    console.log(presenceHook.isConnected.value)
    ElMessage.success('成功加入聊天室')
  } catch (error) {
    console.error('加入聊天室失败:', error)
    ElMessage.error('加入聊天室失败，请重试')
  }
}

// 离开聊天室 - 改为同步函数
const leaveRoom = () => {
  try {
    ElMessage.info('已离开聊天室')
  } catch (error) {
    console.error('离开聊天室失败:', error)
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
  try {
    await checkAuth()
    const fetchedUserInfo = await userStore.fetchUserInfo()
    userInfo.value = fetchedUserInfo || null
    isLoading.value = false
    joinRoom()
  } catch (error) {
    console.error('组件初始化失败:', error)
    ElMessage.error('组件初始化失败，请刷新页面重试')
  }
})

onUnmounted(() => {
  try {
    console.log('ChatRoom component unmounting...')
    leaveRoom()
    presenceHook.cleanUp()
    presenceHook = null
  } catch (error) {
    console.warn('组件卸载时出错:', error)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p class="text-gray-600">
          正在加载聊天组件...
        </p>
      </div>
    </div>

    <div v-else class="container mx-auto px-4 py-6 max-w-6xl">
      <!-- 头部 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <svg class="w-6 h-6 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
              聊天室
              <span class="text-sm font-normal text-gray-500 ml-2"> 房间: {{ roomName }} </span>
            </h1>
            <div class="flex items-center mt-2 space-x-4">
              <div class="flex items-center">
                <div
                  :class="['w-2 h-2 rounded-full mr-2', presenceHook.isConnected.value ? 'bg-green-400' : 'bg-red-400']"
                />
                <span class="text-sm text-gray-600">
                  {{ presenceHook.isConnected.value ? '已连接' : '未连接' }}
                </span>
              </div>
              <span class="text-sm text-gray-500"> 在线用户: {{ presenceHook.onlineUsers.value.size }} </span>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <button class="btn btn-outline btn-sm" :disabled="!presenceHook.isConnected">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {{ userInfo?.name || '' }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- 聊天区域 -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <!-- 消息区域 -->
            <div ref="chatContainerRef" class="h-96 lg:h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                <p class="text-lg">
                  欢迎来到聊天室！
                </p>
                <p class="text-sm text-gray-400 mt-2">
                  开始您的对话吧
                </p>
              </div>

              <!-- 消息列表 -->
              <div
                v-for="message in messages"
                :key="message.id"
                :class="['flex', message.userId === userStore.userId ? 'justify-end' : 'justify-start']"
              >
                <div
                  class="max-w-xs lg:max-w-md flex items-start"
                  :class="[message.userId === userStore.userId ? 'flex-row-reverse' : '']"
                >
                  <!-- 头像 -->
                  <div class="flex-shrink-0 mr-3 ml-3">
                    <div
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        message.userId === userStore.userId
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-200 text-gray-700',
                      ]"
                    >
                      <img
                        v-if="message.avatar"
                        :src="message.avatar"
                        :alt="message.username"
                        class="w-8 h-8 rounded-full object-cover"
                        @error="
                          (e) => {
                            const target = e.target as HTMLImageElement
                            if (target) {
                              target.style.display = 'none'
                              const nextEl = target.nextElementSibling as HTMLElement
                              if (nextEl) nextEl.style.display = 'flex'
                            }
                          }
                        "
                      >
                      <span
                        v-else
                        class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        :class="[
                          message.userId === userStore.userId
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-200 text-gray-700',
                        ]"
                      >
                        {{ message.username.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                  </div>

                  <div class="flex-1">
                    <div v-if="message.userId !== userStore.userId" class="mb-1">
                      <span class="text-xs text-gray-500 font-medium">{{ message.username }}</span>
                    </div>
                    <div
                      :class="[
                        'px-4 py-2 rounded-lg shadow-sm',
                        message.userId === userStore.userId
                          ? 'bg-primary-600 text-white ml-auto'
                          : 'bg-white text-gray-900 border border-gray-200',
                      ]"
                    >
                      <p class="whitespace-pre-wrap break-words">
                        {{ message.content }}
                      </p>
                      <p
                        :class="[
                          'text-xs mt-1',
                          message.userId === userStore.userId ? 'text-primary-100' : 'text-gray-500',
                        ]"
                      >
                        {{ formatTime(message.timestamp) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="border-t border-gray-200 p-4 bg-white">
              <div class="flex space-x-3">
                <div class="flex-1">
                  <textarea
                    v-model="userInput"
                    placeholder="输入消息..."
                    class="form-textarea resize-none"
                    rows="2"
                    :disabled="!presenceHook.isConnected.value"
                    @keydown="handleKeyPress"
                    @input="handleUserInput"
                  />
                </div>
                <button
                  :disabled="!userInput.trim() || !presenceHook.isConnected"
                  class="btn btn-primary self-end"
                  @click="sendMessage"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                Enter 发送，Shift + Enter 换行
              </p>
            </div>
          </div>
        </div>

        <!-- 在线用户列表 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 class="font-semibold text-gray-900 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              在线用户 ({{ presenceHook.onlineUsers.value.size }})
            </h3>
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div
                v-for="[userId, user] of presenceHook.onlineUsers.value"
                :key="userId"
                :class="[
                  'flex items-center p-2 rounded-lg text-sm',
                  userId === userStore.userId
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-700 hover:bg-gray-50',
                ]"
              >
                <div class="relative mr-3">
                  <div
                    :class="[
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      userId === userStore.userId ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-700',
                    ]"
                  >
                    <img
                      v-if="user.avatar"
                      :src="user.avatar"
                      :alt="user.name"
                      class="w-6 h-6 rounded-full object-cover"
                      @error="
                        (e) => {
                          const target = e.target as HTMLImageElement
                          if (target) {
                            target.style.display = 'none'
                            const nextEl = target.nextElementSibling as HTMLElement
                            if (nextEl) nextEl.style.display = 'flex'
                          }
                        }
                      "
                    >
                    <span
                      v-else
                      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                      :class="[
                        userId === userStore.userId ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-700',
                      ]"
                    >
                      {{ user?.name?.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div
                    class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"
                  />
                </div>
                <span class="truncate flex-1">{{ user.name }}</span>
                <span v-if="userId === userStore.userId" class="text-xs text-primary-600 ml-1 flex-shrink-0">(我)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 消息动画 */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
