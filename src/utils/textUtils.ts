import React from 'react'

/**
 * URL正则表达式，匹配常见的URL格式
 * 支持 http://, https://, www. 开头的链接
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

/**
 * 将文本中的URL转换为可点击的链接元素
 * @param text 原始文本
 * @returns React元素数组，包含文本和链接
 */
export function parseTextWithLinks(text: string): (string | React.ReactElement)[] {
  if (!text) return []

  const parts: (string | React.ReactElement)[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // 重置正则表达式的lastIndex
  URL_REGEX.lastIndex = 0

  while ((match = URL_REGEX.exec(text)) !== null) {
    // 添加URL之前的文本
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // 处理URL
    let url = match[0]
    let href = url

    // 如果URL以www.开头，添加https://前缀
    if (url.startsWith('www.')) {
      href = `https://${url}`
    }

    // 创建链接元素
    parts.push(
      React.createElement(
        'a',
        {
          key: match.index,
          href: href,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'announcement-link'
        },
        url
      )
    )

    lastIndex = match.index + match[0].length
  }

  // 添加剩余的文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  // 如果没有匹配到URL，返回原始文本
  if (parts.length === 0) {
    return [text]
  }

  return parts
}

