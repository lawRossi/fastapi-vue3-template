import { setupServer, type SetupServer } from 'msw/node'
import { handlers } from './handlers'

// 导出带类型的 server 实例
export const server: SetupServer = setupServer(...handlers)
