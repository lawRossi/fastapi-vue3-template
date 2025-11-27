import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import { createPinia } from 'pinia'
import App from './App.vue'

// 确保我们的样式在 Element Plus 之后加载
import './styles/index.css'

const enableMocking = async (): Promise<void> => {
  // 仅在开发环境且启用 mock 时加载
  if (import.meta.env.DEV && import.meta.env.VITE_API_MOCK === 'true') {
    const { worker } = await import('./mock/browser')

    await worker.start({
      // 未拦截的请求直接放行
      onUnhandledRequest: 'bypass',

      // Service Worker 选项
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })

    console.log('[MSW] Mocking enabled')
  }
}

// 防止出现 "Cannot find name" 错误
declare global {
  interface Window {
    msw?: {
      worker: any
    }
  }
}

enableMocking().then(() => {
  const app = createApp(App)
  app.use(createPinia()).use(router).use(ElementPlus).mount('#app')
})
