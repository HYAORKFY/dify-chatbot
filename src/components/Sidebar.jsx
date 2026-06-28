import { useState } from 'react'

/**
 * 侧边栏：会话列表管理
 * 功能：新建会话、切换会话、删除会话、重命名会话
 */
function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  loading,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const startEdit = (conv) => {
    setEditingId(conv.id)
    setEditName(conv.name || '新对话')
  }

  const confirmRename = async () => {
    if (editName.trim()) {
      await onRename(editingId, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Dify Chatbot</h2>
        <button className="new-chat-btn" onClick={onNew} disabled={loading}>
          + 新建对话
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 && (
          <p className="empty-tip">暂无会话，点击上方按钮开始</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${activeId === conv.id ? 'active' : ''}`}
            onClick={() => editingId !== conv.id && onSelect(conv.id)}
          >
            {editingId === conv.id ? (
              <div className="rename-box" onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <button className="ok-btn" onClick={confirmRename}>确定</button>
              </div>
            ) : (
              <>
                <span className="conv-name">
                  {conv.name || '新对话'}
                </span>
                <div className="conv-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn"
                    title="重命名"
                    onClick={() => startEdit(conv)}
                  >
                    ✏
                  </button>
                  <button
                    className="icon-btn danger"
                    title="删除"
                    onClick={() => {
                      if (confirm('确定删除此会话？')) onDelete(conv.id)
                    }}
                  >
                    🗑
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span>已连接 Dify API</span>
      </div>
    </aside>
  )
}

export default Sidebar
