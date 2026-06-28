/**
 * 单条消息气泡
 * 支持：用户消息、AI 消息、流式打字动画、思维链折叠、点赞/点踩
 */
function MessageBubble({ message, onFeedback, isStreaming }) {
  const isUser = message.role === 'user'
  const hasReasoning = message.reasoning && message.reasoning.trim()

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="message-body">
        <div className="message-content">
          {message.content}
          {isStreaming && <span className="cursor">▋</span>}
        </div>

        {/* 思维链（DeepSeek R1 推理过程），可折叠 */}
        {hasReasoning && (
          <details className="reasoning-box">
            <summary>💭 思考过程</summary>
            <div className="reasoning-content">{message.reasoning}</div>
          </details>
        )}

        {/* AI 消息底部的操作栏 */}
        {!isUser && !isStreaming && message.id && (
          <div className="message-actions">
            <button
              className={`feedback-btn ${message.feedback === 'like' ? 'active' : ''}`}
              title="点赞"
              onClick={() => onFeedback(message.id, message.feedback === 'like' ? 'null' : 'like')}
            >
              👍
            </button>
            <button
              className={`feedback-btn ${message.feedback === 'dislike' ? 'active' : ''}`}
              title="点踩"
              onClick={() => onFeedback(message.id, message.feedback === 'dislike' ? 'null' : 'dislike')}
            >
              👎
            </button>
            {message.feedback === 'like' && <span className="feedback-text">已点赞</span>}
            {message.feedback === 'dislike' && <span className="feedback-text">已点踩</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
