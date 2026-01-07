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

  // 定义系统预设提示词
  const systemPrompt = {
    role: 'system',
    content: `
      你是一个专业的数码产品对比专家，专注于手机参数对比。
      
      你的任务规则如下：
      1. 当用户输入手机型号时，请调用联网搜索功能获取这些手机的最新、最准确的硬件参数。
      2. 必须以 Markdown 表格的形式输出对比结果。
      3. 表格要求：
         - 表头（列名）为手机的具体型号。
         - 第一列为参数维度（如：价格、处理器/SoC、屏幕尺寸与材质、刷新率、后置摄像头参数、前置摄像头、电池容量、充电功率、机身重量/厚度、操作系统等）。
      4. 对比完成后，简要总结各款手机的优缺点和适用人群。
      5. 如果用户只输入了一个型号，请列出该手机详细参数，并询问需要对比的竞品。
    `
  }

  // 3. 调用模型
  const response = await client.chat.completions.create({
    model: 'qwen-plus-2025-12-01',
    messages: [systemPrompt, ...messages],
    stream: true, // 开启流式输出
    // @ts-ignore 阿里云特定参数：开启联网搜索以获取最新信息
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
