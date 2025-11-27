import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { type RealtimeChannel } from '@supabase/supabase-js'


export interface UserPresence {
  userId: string
  status: 'online' | 'away' | 'busy'
  lastSeen: Date
  avatar?: string
  name?: string
}

interface UsePresenceOptions {
  userId: string
  roomId: string
  name?: string
  avatar?: string
  initialStatus?: UserPresence['status'],
  broadcastCallbacks: Map<string, (payload: any) => void>
}


const onlineUsers = ref<Map<string, UserPresence>>(new Map())
const isConnected = ref(false)
const roomChannel = ref<RealtimeChannel>()

export function usePresence(options: UsePresenceOptions) {
  const { userId, roomId, name = '', avatar = '', initialStatus = 'online' } = options
  console.log('usePresence', userId, roomId, name, avatar, initialStatus)

  roomChannel.value = supabase.channel(roomId, {
    config: {
      private: true,
      broadcast: { self: true, ack: false },
      presence: {
        key: userId,
      }
    },
  })

  roomChannel.value.on('presence', { event: 'sync' }, () => {
    console.log('Presence同步完成')
    const state = roomChannel.value!.presenceState<UserPresence>()

    const newUsers = new Map<string, UserPresence>()
    Object.entries(state).forEach(([key, presences]) => {
      if (presences !== undefined && presences.length > 0) {
        const presence = presences[0] as UserPresence
        newUsers.set(key, presence)
      }
    })
    onlineUsers.value = newUsers
  })

  roomChannel.value.on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('用户加入:', key, newPresences)
  })

  roomChannel.value.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('用户离开:', key, leftPresences)
  })

  options.broadcastCallbacks.forEach((callback, event) => {
    console.log(event)
    roomChannel.value?.on('broadcast', {event:event}, callback)
  })

  roomChannel.value.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      isConnected.value = true
      console.log('频道订阅成功')
      await roomChannel.value?.track({
        userId,
        name,
        avatar,
        status: initialStatus,
        lastSeen: Date.now(),
      })
    }
  })

  const updateStatus = async (status: UserPresence['status']) => {
    if (roomChannel.value && isConnected.value) {
      await roomChannel.value.track({
        userId,
        status,
        lastSeen: Date.now(),
      })
    }
  }

  const cleanUp = () => {
    if (roomChannel.value) {
      isConnected.value = false
      onlineUsers.value.clear()
      try {
        roomChannel.value.untrack()
        roomChannel.value.unsubscribe()
        supabase.removeChannel(roomChannel.value)
      } catch (error) {
        console.warn('Presence cleanup error:', error)
      }
    }
  }

  return {
    roomChannel,
    isConnected,
    onlineUsers,
    updateStatus,
    cleanUp,
  }
}
