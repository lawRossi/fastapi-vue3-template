import { setupWorker, type SetupWorker } from 'msw/browser'
import { handlers } from './handlers'

// 导出带类型的 worker 实例
export const worker: SetupWorker = setupWorker(...handlers)
