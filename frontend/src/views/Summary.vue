<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-4">
      文本摘要
    </h1>

    <form class="mb-6" @submit.prevent="submitSummary">
      <div class="mb-4">
        <label for="inputText" class="block text-sm font-medium text-gray-700 mb-2"> 输入文本 </label>
        <textarea
          id="inputText"
          v-model="inputText"
          rows="6"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="请输入需要摘要的文本..."
          required
        />
      </div>

      <button
        type="submit"
        :disabled="loading || !inputText.trim()"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {{ loading ? '处理中...' : '生成摘要' }}
      </button>
    </form>

    <div v-if="result" class="p-4 bg-gray-50 rounded-md">
      <h2 class="text-lg font-semibold mb-2">
        摘要结果
      </h2>
      <p class="text-gray-800 whitespace-pre-wrap">
        {{ result }}
      </p>
    </div>

    <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-600">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SupabaseDB, supabase } from '@/utils/supabase'

// Reactive data
const inputText = ref('')
const result = ref('')
const loading = ref(false)
const error = ref('')
const taskId = ref('')
let subscription: any = null
let timeoutId: any = null

// Generate UUID for taskId
const generateTaskId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Submit summary request
const submitSummary = async () => {
  if (!inputText.value.trim()) return

  loading.value = true
  error.value = ''
  result.value = ''
  taskId.value = generateTaskId()

  // Clear previous timeout if exists
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  // Unsubscribe previous subscription if exists
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }

  // Subscribe with filter for current taskId
  subscription = SupabaseDB.subscribe('llm_result', handleLlmResult, { id: taskId.value })

  try {
    // Prepare messages for summary
    const messages = [
      {
        role: 'system',
        content: '请为以下文本生成一个简洁的摘要。',
      },
      {
        role: 'user',
        content: inputText.value,
      },
    ]

    // Call the 'llm' edge function
    supabase.functions.invoke('llm', {
      body: {
        taskId: taskId.value,
        messages: messages,
        model: 'glm-4.5-air',
      },
    })

    // Set timeout for 10 seconds
    timeoutId = setTimeout(() => {
      error.value = '请求超时，请重试'
      loading.value = false
      if (subscription) {
        subscription.unsubscribe()
        subscription = null
      }
      timeoutId = null
    }, 15000)
  } catch (err) {
    console.error('Error:', err)
    error.value = err instanceof Error ? err.message : '发生未知错误'
    loading.value = false
    // Unsubscribe on error
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }
    // Clear timeout on error
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
}

// Handle LLM result subscription
const handleLlmResult = (payload: any) => {
  if (payload.eventType === 'INSERT' && payload.new.id === taskId.value) {
    // Clear timeout since we got the result
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    // Parse the LLM response
    const llmData = payload.new.llmResponse
    if (llmData.choices && llmData.choices[0]?.message?.content) {
      result.value = llmData.choices[0].message.content
      loading.value = false
      taskId.value = '' // Reset taskId to avoid processing old results
      // Unsubscribe after receiving the result
      if (subscription) {
        subscription.unsubscribe()
        subscription = null
      }
    } else {
      error.value = '无法解析摘要结果'
      loading.value = false
      if (subscription) {
        subscription.unsubscribe()
        subscription = null
      }
    }
  }
}

// Setup subscription on mount (initially without filter, will be replaced when submitting)
onMounted(() => {
  // Subscription will be created with filter in submitSummary
})

// Cleanup subscription and timeout on unmount
onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
