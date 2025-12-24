import OpenAI from 'openai'

export default defineEventHandler(async event => {
  // 1. 获取前端传来的消息历史
  const { messages } = await readBody(event)

  // 2. 初始化阿里云客户端
  // 建议将 Key 放入 .env 文件: NUXT_ALIYUN_API_KEY=sk-xxx
  const config = useRuntimeConfig()
  const apiKey = config.aliyunApiKey

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' // 阿里云兼容接口地址
  })

  // 3. 调用模型
  const response = await client.chat.completions.create({
    model: 'qwen-plus-2025-12-01', // 推荐: qwen-plus, qwen-turbo, qwen-max
    messages: messages,
    stream: true, // 开启流式输出
    enable_search: true
  })

  // 4. 将 OpenAI 的流转换为 Web ReadableStream 返回给前端
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          controller.enqueue(new TextEncoder().encode(content))
        }
      }
      controller.close()
    }
  })

  return sendStream(event, stream)
})
