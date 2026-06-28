// Dify API 服务模块
// 封装所有对话应用相关端点
// 文档: https://docs.dify.ai/zh-hans/guides/application-publishing/developing-with-apis

// 通过 Vite 代理访问 Dify API，避免浏览器 CORS 限制
// API Key 从环境变量读取（.env 文件，已被 .gitignore 忽略）
const BASE_URL = import.meta.env.VITE_DIFY_BASE_URL || '/dify-api'
const API_KEY = import.meta.env.VITE_DIFY_API_KEY

// 默认用户标识（前端演示用，生产环境应使用真实用户体系）
const DEFAULT_USER = 'web-user-001'

/**
 * 统一构造请求头
 */
function getHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${API_KEY}`,
    ...extra,
  }
}

/**
 * 1. 发送对话消息 (阻塞模式)
 * POST /chat-messages  response_mode=blocking
 */
export async function sendMessageBlocking(query, conversationId = '', user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/chat-messages`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'blocking',
      conversation_id: conversationId,
      user,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`发送消息失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 2. 发送对话消息 (流式模式)
 * POST /chat-messages  response_mode=streaming
 * 返回可读流，逐块解析 SSE 事件
 */
export async function sendMessageStream(
  query,
  conversationId = '',
  { user = DEFAULT_USER, files = [], onEvent, signal } = {}
) {
  const res = await fetch(`${BASE_URL}/chat-messages`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'streaming',
      conversation_id: conversationId,
      user,
      files,
    }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`流式消息失败 (${res.status}): ${text}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop()
    for (const part of parts) {
      const event = parseSSE(part)
      if (event && onEvent) onEvent(event)
    }
  }
  if (buffer.trim()) {
    const event = parseSSE(buffer)
    if (event && onEvent) onEvent(event)
  }
}

/**
 * 解析单个 SSE 事件块
 */
function parseSSE(chunk) {
  const lines = chunk.split('\n')
  let event = null
  let data = ''
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim()
    }
  }
  if (!data) return null
  try {
    return { event, data: JSON.parse(data) }
  } catch {
    return { event, data: { raw: data } }
  }
}

/**
 * 3. 获取会话列表
 * GET /conversations
 */
export async function getConversations(user = DEFAULT_USER, limit = 20) {
  const res = await fetch(`${BASE_URL}/conversations?user=${encodeURIComponent(user)}&limit=${limit}`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`获取会话列表失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 4. 获取会话历史消息
 * GET /messages
 */
export async function getMessages(conversationId, user = DEFAULT_USER, limit = 20) {
  const res = await fetch(
    `${BASE_URL}/messages?user=${encodeURIComponent(user)}&conversation_id=${encodeURIComponent(conversationId)}&limit=${limit}`,
    { headers: getHeaders() }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`获取历史消息失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 5. 删除会话
 * DELETE /conversations/{conversation_id}
 */
export async function deleteConversation(conversationId, user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ user }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`删除会话失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 6. 重命名会话
 * POST /conversations/{conversation_id}/name
 */
export async function renameConversation(conversationId, name, user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(conversationId)}/name`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name, user, auto_generate: false }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`重命名会话失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 7. 停止生成
 * POST /chat-messages/{task_id}/stop
 */
export async function stopGenerate(taskId, user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/chat-messages/${encodeURIComponent(taskId)}/stop`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ user }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`停止生成失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 8. 消息反馈（点赞/点踩）
 * POST /messages/{message_id}/feedbacks
 */
export async function messageFeedback(messageId, rating, user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/messages/${encodeURIComponent(messageId)}/feedbacks`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ rating, user, content: '' }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`消息反馈失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 9. 获取推荐问题（下一轮建议）
 * GET /messages/{message_id}/suggested
 */
export async function getSuggestedQuestions(messageId, user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/messages/${encodeURIComponent(messageId)}/suggested?user=${encodeURIComponent(user)}`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`获取推荐问题失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 10. 文件上传（图片）
 * POST /files/upload
 */
export async function uploadFile(file, user = DEFAULT_USER) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user', user)
  const res = await fetch(`${BASE_URL}/files/upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`文件上传失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 11. 获取应用参数（开场白、推荐问题、文件上传配置等）
 * GET /parameters
 */
export async function getParameters(user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/parameters?user=${encodeURIComponent(user)}`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`获取应用参数失败 (${res.status}): ${text}`)
  }
  return res.json()
}

/**
 * 12. 获取应用信息（工具图标等）
 * GET /meta
 */
export async function getMeta(user = DEFAULT_USER) {
  const res = await fetch(`${BASE_URL}/meta?user=${encodeURIComponent(user)}`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`获取应用信息失败 (${res.status}): ${text}`)
  }
  return res.json()
}

export { DEFAULT_USER }
