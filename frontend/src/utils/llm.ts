// Supabase 配置
const llm_base_url = import.meta.env.VITE_LLM_BASE_URL as string
const llm_api_key = import.meta.env.VITE_LLM_API_KEY as string

if (!llm_base_url || !llm_api_key) {
  throw new Error('LLM_BASE_URL and LLM_API_KEY must be provided in environment variables')
}

// types.ts
interface OpenAIStreamChoice {
  delta: {
    content?: string
  }
  index: number
  finish_reason: string | null
}

interface OpenAIStreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: OpenAIStreamChoice[]
}

// supabase-functions-client.ts
export class SupabaseFunctionClient {
  static async invokeStream<T = any>(body: T, onChunk: (content: string) => void): Promise<void> {
    const url = `${llm_base_url}/chat/completions`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${llm_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value }: ReadableStreamReadResult<Uint8Array> = await reader.read()

        if (done) break

        const chunk: string = decoder.decode(value, { stream: true })
        const lines: string[] = chunk.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data: string = line.slice(6)

            if (data === '[DONE]') {
              return
            }

            try {
              const parsed: OpenAIStreamChunk = JSON.parse(data)
              const content: string = parsed.choices[0]?.delta?.content ?? ''

              if (content) {
                onChunk(content)
              }
            } catch (e) {
              console.error('JSON parse error:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream request failed:', error)
      throw error
    }
  }
}
