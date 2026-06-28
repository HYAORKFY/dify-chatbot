import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import {
  sendMessageStream,
  getConversations,
  getMessages,
  deleteConversation,
  renameConversation,
  stopGenerate,
  messageFeedback,
  getParameters,
} from './difyApi'
import { parseAnswer } from './utils'
import './App.css'

function App() {
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [openingStatement, setOpeningStatement] = useState('')
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(false)

  const abortControllerRef = useRef(null)
  const currentTaskIdRef = useRef(null)

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true)
    try {
      const data = await getConversations()
      setConversations(data.data || [])
    } catch (e) {
      console.error('加载会话列表失败:', e)
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  const loadParameters = useCallback(async () => {
    try {
      const data = await getParameters()
      setOpeningStatement(data.opening_statement || '')
      setSuggestedQuestions(data.suggested_questions || [])
    } catch (e) {
      console.error('加载应用参数失败:', e)
    }
  }, [])

  useEffect(() => {
    loadConversations()
    loadParameters()
  }, [loadConversations, loadParameters])

  const handleSelectConversation = useCallback(async (convId) => {
    setActiveConversationId(convId)
    setError(null)
    try {
      const data = await getMessages(convId)
      const history = (data.data || []).reverse().map((m) => ({
        key: m.id,
        id: m.id,
        role: m.is_query ? 'user' : 'assistant',
        content: m.is_query ? m.query : m.answer,
        feedback: null,
      }))
      setMessages(history)
    } catch (e) {
      setError(e.message)
      setMessages([])
    }
  }, [])

  const handleNewConversation = useCallback(() => {
    setActiveConversationId('')
    setMessages([])
    setError(null)
  }, [])

  const handleDeleteConversation = useCallback(async (convId) => {
    try {
      await deleteConversation(convId)
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (activeConversationId === convId) {
        handleNewConversation()
      }
    } catch (e) {
      setError(e.message)
    }
  }, [activeConversationId])

  const handleRenameConversation = useCallback(async (convId, name) => {
    try {
      await renameConversation(convId, name)
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, name } : c))
      )
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const handleSend = useCallback(async (query) => {
    setError(null)
    const userMsg = { key: Date.now(), role: 'user', content: query }
    const assistantMsg = {
      key: Date.now() + 1,
      role: 'assistant',
      content: '',
      reasoning: '',
      streaming: true,
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setGenerating(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      await sendMessageStream(query, activeConversationId, {
        signal: controller.signal,
        onEvent: (evt) => {
          const { event, data } = evt
          const evtType = event || (data && data.event)
          if (evtType === 'message') {
            const answer = data.answer || ''
            currentTaskIdRef.current = data.task_id
            const parsed = parseAnswer(answer)
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              updated[updated.length - 1] = {
                ...last,
                id: data.message_id || last.id,
                content: parsed.content,
                reasoning: parsed.reasoning || last.reasoning,
                conversationId: data.conversation_id,
              }
              return updated
            })
            if (data.conversation_id && !activeConversationId) {
              setActiveConversationId(data.conversation_id)
              loadConversations()
            }
          } else if (evtType === 'message_end') {
            currentTaskIdRef.current = data.task_id
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                streaming: false,
                id: data.message_id || updated[updated.length - 1].id,
              }
              return updated
            })
          } else if (evtType === 'error') {
            setError(data.message || '生成出错')
          }
        },
      })
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message)
      }
      setMessages((prev) => {
        const updated = [...prev]
        if (updated.length > 0 && updated[updated.length - 1].streaming) {
          updated[updated.length - 1].streaming = false
          if (!updated[updated.length - 1].content) {
            updated[updated.length - 1].content = '（已停止或生成失败）'
          }
        }
        return updated
      })
    } finally {
      setGenerating(false)
      abortControllerRef.current = null
      currentTaskIdRef.current = null
    }
  }, [activeConversationId, loadConversations])

  const handleStop = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (currentTaskIdRef.current) {
      try {
        await stopGenerate(currentTaskIdRef.current)
      } catch (e) {
        console.error('停止生成请求失败:', e)
      }
    }
    setGenerating(false)
    setMessages((prev) => {
      const updated = [...prev]
      if (updated.length > 0 && updated[updated.length - 1].streaming) {
        updated[updated.length - 1].streaming = false
      }
      return updated
    })
  }, [])

  const handleFeedback = useCallback(async (messageId, rating) => {
    try {
      await messageFeedback(messageId, rating)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, feedback: rating === 'null' ? null : rating } : m
        )
      )
    } catch (e) {
      console.error('反馈失败:', e)
    }
  }, [])

  const handleSuggestedClick = useCallback((q) => {
    handleSend(q)
  }, [handleSend])

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        loading={loadingConvs}
      />
      <ChatArea
        messages={messages}
        conversationId={activeConversationId}
        onSend={handleSend}
        onStop={handleStop}
        onFeedback={handleFeedback}
        generating={generating}
        openingStatement={openingStatement}
        suggestedQuestions={suggestedQuestions}
        onSuggestedClick={handleSuggestedClick}
        error={error}
      />
    </div>
  )
}

export default App
