import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

/**
 * 聊天主区域
 * 功能：流式发送消息、停止生成、自动滚动、开场白展示
 */
function ChatArea({
  messages,
  conversationId,
  onSend,
  onStop,
  onFeedback,
  generating,
  openingStatement,
  suggestedQuestions,
  onSuggestedClick,
  error,
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 自适应输入框高度
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [input])

  const handleSend = () => {
    if (!input.trim() || generating) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className="chat-area">
      <div className="messages-container">
        {/* 开场白 */}
        {messages.length === 0 && openingStatement && (
          <div className="opening-statement">
            <div className="message assistant">
              <div className="avatar">🤖</div>
              <div className="message-body">
                <div className="message-content">{openingStatement}</div>
              </div>
            </div>
            {suggestedQuestions.length > 0 && (
              <div className="suggested-questions">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} className="suggested-q" onClick={() => onSuggestedClick(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.key || msg.id}
            message={msg}
            onFeedback={onFeedback}
            isStreaming={msg.streaming}
          />
        ))}

        {/* 空状态 */}
        {messages.length === 0 && !openingStatement && (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <p>开始与 AI 对话吧！</p>
          </div>
        )}

        {error && <div className="chat-error">⚠ {error}</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入栏 */}
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={generating ? 'AI 正在回复...' : '输入消息，Enter 发送，Shift+Enter 换行'}
          disabled={generating}
          rows={1}
        />
        {generating ? (
          <button className="stop-btn" onClick={onStop}>
            ⏹ 停止
          </button>
        ) : (
          <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
            ➤ 发送
          </button>
        )}
      </div>
    </main>
  )
}

export default ChatArea
