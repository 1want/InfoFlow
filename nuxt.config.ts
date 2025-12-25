// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // css: ['assets/css/main.css'],
  runtimeConfig: {
    // 私有配置（仅服务端可用）
    aliyunApiKey: '', // 这里留空，它会自动读取环境变量 NUXT_ALIYUN_API_KEY
    // 公共配置（客户端也可用）
    public: {}
  },
  modules: ['@nuxtjs/tailwindcss'],
  // 兼容性配置，防止 markstream-vue 在 SSR 中报错
  build: {
    transpile: ['markstream-vue', 'shiki']
  },
  vite: {
    optimizeDeps: {
      include: ['markstream-vue', 'shiki']
    }
  }
})
