import Mock from 'mockjs'
import { http, HttpResponse, RequestHandler } from 'msw'
import { type UserInfo } from '@/api/user'

interface MockResponse<T = any> {
  code: number
  msg?: string
  data: T
}

export const handlers: RequestHandler[] = [
  http.get<never, never, MockResponse>('/api/user/info', () => {
    return HttpResponse.json({
      code: 200,
      data: {
        id: Mock.Random.integer(1, 100),
        name: Mock.Random.cname(),
        avatar: Mock.Random.image('200x200'),
      },
    })
  }),

  http.post<never, UserInfo>('/api/user/add_info', () => {
    return HttpResponse.json({
      code: 200,
      data: {
        id: Mock.Random.integer(1, 100),
        name: Mock.Random.cname(),
        avatar: Mock.Random.image('200x200'),
      },
    })
  }),

  // 流式响应（AI 聊天）
  http.post<never, { message: string }>('/api/chat', () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const responses = ['你好', '！', '我是', 'AI', '助手']
        for (const text of responses) {
          controller.enqueue(encoder.encode(text))
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }),
]
