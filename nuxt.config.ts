export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  runtimeConfig: {
    // 私有配置（仅服务端可用）
    aliyunApiKey: '' // 这里留空，它会自动读取环境变量 NUXT_ALIYUN_API_KEY
  }
})
