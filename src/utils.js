// 工具函数：解析 AI 回复，分离思维链和正文
// DeepSeek R1 思维链通常以 markdown 引用块 开头，或用特定标签包裹

export function parseAnswer(raw) {
  if (!raw) return { content: '', reasoning: '' }

  let text = raw

  // 情况1: 以 markdown 引用块开头 (每行以 > 开始)
  const lines = text.split('\n')
  if (lines[0] && lines[0].trimStart().startsWith('>')) {
    const reasoningLines = []
    let i = 0
    while (i < lines.length && lines[i].trimStart().startsWith('>')) {
      reasoningLines.push(lines[i].replace(/^\s*>\s?/, ''))
      i++
    }
    const reasoning = reasoningLines.join('\n').trim()
    const content = lines.slice(i).join('\n').trim()
    return { content: content || text, reasoning }
  }

  // 情况2: 包含 think 标签
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/i)
  if (thinkMatch) {
    return {
      reasoning: thinkMatch[1].trim(),
      content: thinkMatch[2].trim(),
    }
  }

  // 情况3: 以特定标记开头 (如 "思维链:" 等)
  const markerMatch = text.match(/^(思维链|思考过程|Thought|Reasoning)[::]\s*([\s\S]*?)(?:\n(?:正文|回答|Answer|Response)[::]\s*([\s\S]*))?$/i)
  if (markerMatch) {
    return {
      reasoning: (markerMatch[2] || '').trim(),
      content: (markerMatch[3] || text).trim(),
    }
  }

  // 默认: 无思维链
  return { content: text, reasoning: '' }
}
