# InfoFlow - AI 资讯助手 (Demo)

> ⚠️ **免责声明 / Disclaimer**
>
> 本项目仅供 **个人学习与技术研究** 使用。
> 项目中涉及的 API 调用（如阿里云百炼、OpenAI 等）仅作为技术验证示例。
> 请勿将本项目直接用于商业用途，开发者不对因使用本项目产生的任何费用或法律后果负责。

## 📖 项目简介

InfoFlow 是一个基于 **Nuxt 3** 构建的极简 AI 资讯助手 Demo。它展示了如何利用现代前端技术栈构建一个流式对话应用。

- **框架**: [Nuxt 3](https://nuxt.com) (Vue 3)
- **样式**: SCSS (手写样式，无 CSS 框架依赖)
- **图标**: [Iconify](https://iconify.design)
- **Markdown 渲染**: `markdown-it` + `highlight.js` (自定义流式渲染组件)
- **AI 接入**: OpenAI SDK (兼容阿里云百炼 / DeepSeek 等)

## ✅ 环境要求

在运行本项目之前，请确保你的环境满足以下要求：

- **Node.js**: v23.8.0
- **包管理器**: pnpm 10.26.2

## 🚀 快速开始

### 1. 配置环境变量

在项目根目录创建 `.env` 文件，并填入你的 API Key：

```env
# 示例配置
NUXT_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. 安装依赖

```bash
pnpm install

pnpm dev
```
