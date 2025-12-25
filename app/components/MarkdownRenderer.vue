<template>
  <div class="markdown-body" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    let highlightedCode = ''
    if (lang && hljs.getLanguage(lang)) {
      try {
        highlightedCode = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      } catch (__) {}
    } else {
      highlightedCode = md.utils.escapeHtml(str)
    }

    return `<div class="code-block-wrapper"><pre class="hljs language-${lang}"><code>${highlightedCode}</code></pre></div>`
  }
})

// 自定义链接渲染
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
.markdown-body {
  font-size: 15px;
  line-height: 1.6;
  color: #24292f;
  word-wrap: break-word;
  overflow-wrap: break-word;

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

  /* 表格样式 */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
    background-color: #fff;
    font-size: 14px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    table-layout: fixed;
  }
  thead {
    color: #909399;
    font-weight: 500;
  }
  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid #ebeef5;
    text-align: left;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-all;
  }
  th {
    background-color: #f5f7fa;
    white-space: normal;
  }
  tr:hover td {
    background-color: #f5f7fa;
  }
  tr:last-child td {
    border-bottom: none;
  }

  /* --- 代码块样式 (暗色主题) --- */
  .code-block-wrapper {
    margin: 1em 0;
    border-radius: 6px;
    overflow: hidden;
    background-color: #282c34; /* 暗色背景 */
    border: 1px solid #3e4451;
  }

  pre {
    margin: 0 !important;
    padding: 16px !important;
    overflow: auto;
    background-color: transparent !important;
    border-radius: 0 !important;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    white-space: pre-wrap !important;
    word-break: break-all !important;
    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      color: #abb2bf; /* 浅色文字 */
    }
  }

  /* 行内代码 */
  code:not(pre code) {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  }
}

/* 暗色模式适配 */
.dark .markdown-body {
  color: #c9d1d9;
  table {
    background-color: #1d1e1f;
    border-color: #363637;
  }
  th {
    background-color: #2b2b2c;
    border-bottom-color: #363637;
    color: #a3a6ad;
  }
  td {
    border-bottom-color: #363637;
    color: #cfd3dc;
  }
  tr:hover td {
    background-color: #2b2b2c;
  }
  code:not(pre code) {
    background-color: rgba(110, 118, 129, 0.4);
  }
  blockquote {
    border-left-color: #30363d;
    color: #8b949e;
  }
}
</style>
