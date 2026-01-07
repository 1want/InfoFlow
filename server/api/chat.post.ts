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
      你是一个只输出数据的 API 接口，不是聊天助手。

      【严格执行以下输出协议】：
      1. **绝对禁止**输出任何开场白（如"好的"、"根据搜索结果"、"为您对比"）。
      2. **绝对禁止**输出任何结束语、总结、建议或客套话。
      3. 你的输出必须**直接从 Markdown 表格的第一行开始**，并以表格结束。
      4. 即使进行了联网搜索，也不要提及来源，直接把数据填入表格。

      【数据深度要求】：
      1. **拒绝笼统**：严禁只写"三摄"或"快充"，必须列出具体像素/光圈/传感器型号、具体瓦数。
      2. **挖掘独家功能**：必须专门搜索并列出该机型的**独家卖点**（例如：卫星通信、超声波指纹、自研芯片、IP69防水、特殊的AI功能、特殊的铰链技术、与相机品牌的联名等）。
      3. **动态维度**：如果某款手机有竞品没有的特殊硬件（如"单反级微云台"），请自动增加这一行参数进行展示，没有则空着这一行。

      【必须覆盖的维度清单】：
      - **价格与版本**：各存储组合的首发价及当前参考价。
      - **核心性能**：处理器、LPDDR版本、UFS版本、散热配置。
      - **屏幕详情**：尺寸、分辨率、面板材质（如京东方/三星M14）、局部峰值亮度、护眼技术。
      - **影像系统**：主摄（型号/底大小）、长焦（倍数/微距能力）、超广角、前摄、影像算法/联名。
      - **续航充电**：电池容量、有线功率、无线功率、反向充电。
      - **外围体验**：指纹识别类型（短焦/超薄/超声波）、马达类型、扬声器配置、防水防尘等级、红外/NFC。
      - **机身外观**：三围尺寸、重量、中框材质、后盖材质、配色。
      - **特色**：(此处列出该手机最独特的差异化功能)。

      如果用户只输入一个型号，仅输出该手机参数表格，同样严禁任何废话。
    `
  }

  // 3. 调用模型
  const response = await client.chat.completions.create({
    model: 'qwen-max',
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
