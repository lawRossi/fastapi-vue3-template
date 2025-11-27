<script setup lang="ts">
import { computed } from 'vue'
import { usePresence } from '@/utils/usePresence'

const props = defineProps<{
  roomId: string
  userId: string
  userName: string
  avatar?: string
}>()

// 使用 Presence 组合函数（Vue 3 核心差异）
const { onlineUsers, isConnected, userCount, updateStatus } = usePresence({
  userId: props.userId,
  roomId: props.roomId,
  initialStatus: 'online',
})

// 当前用户状态（从在线用户列表中获取）
const currentUserStatus = computed(() => {
  const current = onlineUsers.value.find((u) => u.userId === props.userId)
  return current?.status || 'online'
})

// 状态选项
const statuses: Array<'online' | 'away' | 'busy'> = ['online', 'away', 'busy']
const statusText = {
  online: '在线',
  away: '离开',
  busy: '忙碌',
}
</script>

<template>
  <div class="presence-container">
    <!-- 连接状态指示器 -->
    <div class="status-bar" :class="{ connected: isConnected }">
      <span>{{ isConnected ? '已连接' : '连接中...' }}</span>
      <span class="user-count">在线用户: {{ userCount }}</span>
    </div>

    <!-- 用户状态切换 -->
    <div class="controls">
      <button
        v-for="status in statuses"
        :key="status"
        :class="{ active: currentUserStatus === status }"
        @click="updateStatus(status)"
      >
        {{ statusText[status] }}
      </button>
    </div>

    <!-- 在线用户列表 -->
    <ul class="user-list">
      <li v-for="user in onlineUsers" :key="user.userId" class="user-item" :class="`status-${user.status}`">
        <img :src="user.avatar" :alt="user.name" class="avatar">
        <span class="name">{{ user.name }}</span>
        <span class="status-indicator" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.status-bar.connected {
  background-color: #4ade80;
}
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}
.user-item.status-online {
  color: #4ade80;
}
.user-item.status-away {
  color: #fbbf24;
}
.user-item.status-busy {
  color: #f87171;
}
</style>
