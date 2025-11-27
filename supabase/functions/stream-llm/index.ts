// @deno-types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts"

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages, model } = await req.json()

    // Validate prompt
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate model
    if (!model || typeof model !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid model' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LLM_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const baseUrl = Deno.env.get('LLM_BASE_URL')
    if (!baseUrl) {
      return new Response(JSON.stringify({ error: 'API base URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Make streaming request to OpenAI
    const llmResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages,
        stream: true
      }),
    })

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text()
      console.error('OpenAI API error:', errorText)
      return new Response(JSON.stringify({ error: 'OpenAI API error' }), {
        status: llmResponse.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Return the streaming response
    return new Response(llmResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
