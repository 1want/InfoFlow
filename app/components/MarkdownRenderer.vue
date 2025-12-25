<template>
  <div class="markdown-body" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css' // 引入代码高亮样式

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs language-${lang}"><code>${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`
      } catch (__) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// 自定义链接渲染，强制新标签页打开
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrSet('target', '_blank')
  return defaultRender(tokens, idx, options, env, self)
}

const renderedContent = computed(() => {
  return md.render(props.content || '')
})
</script>

<style lang="scss">
/* 复刻 ChatGPT-Web 的 Markdown 样式 */
.markdown-body {
  font-size: 15px;
  line-height: 1.6;
  color: #24292f;
  word-wrap: break-word;

  p {
    margin-bottom: 1em;
    &:last-child {
      margin-bottom: 0;
    }
  }

  a {
    color: #10a37f;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  ul,
  ol {
    padding-left: 1.5em;
    margin-bottom: 1em;
  }

  /* 代码块样式 */
  pre {
    margin: 1em 0;
    padding: 1em;
    overflow: auto;
    border-radius: 6px;
    background-color: #282c34; /* 深色背景 */
    color: #abb2bf;

    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      color: inherit;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
  }

  /* 行内代码 */
  code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  }

  blockquote {
    margin: 1em 0;
    padding-left: 1em;
    border-left: 4px solid #d0d7de;
    color: #656d76;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }
}

/* 暗色模式适配 (如果父级有 .dark 类) */
.dark .markdown-body {
  color: #c9d1d9;

  code {
    background-color: rgba(110, 118, 129, 0.4);
  }

  blockquote {
    border-left-color: #30363d;
    color: #8b949e;
  }
}
</style>
