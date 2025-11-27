<!-- App.vue -->
<template>
  <Presence room-id="lobby" user-id="user-456" user-name="张三" avatar="/avatars/zhangsan.jpg" />
</template>

<script setup lang="ts">
import Presence from '@/components/Presence.vue'
</script>
