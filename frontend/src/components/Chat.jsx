import { useState, useRef, useEffect } from 'react'
import './Chat.css'

const API_URL = 'http://localhost:8000'

function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    const message = input.trim()

    if (!message) return

    // Add user message to chat
    setMessages((prev) => [...prev, { type: 'user', text: message }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      setMessages((prev) => [...prev, { type: 'bot', text: data.response }])
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to connect to server. Make sure the backend is running on http://localhost:8000')
      setMessages((prev) => [...prev, {
        type: 'bot',
        text: `Error: ${err.message}`
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatMessage = (text) => {
    if (!text) return ''
    // Replace * at start of lines with a bullet point
    let cleaned = text.replace(/^\s*\* /gm, '• ')
    // Remove remaining * (often used for bolding like **text**)
    cleaned = cleaned.replace(/\*/g, '')
    return cleaned
  }

  return (
    <div className={`chat-app ${messages.length === 0 ? 'initial-state' : ''}`}>
      {messages.length > 0 && (
        <div className="chat-header">
          <h1>💬 Chat with AI</h1>
          <p>Powered by FastAPI + React</p>
        </div>
      )}

      <div className="chat-container">
        {messages.length > 0 && (
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}-message`}>
                <div className="message-bubble">
                  <p>
                    <span className="message-icon">{msg.type === 'user' ? '👤' : '🤖'}</span>
                    <span className="message-label">{msg.type === 'user' ? 'You' : 'Bot'}:</span>
                    {formatMessage(msg.text)}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message bot-message">
                <div className="message-bubble">
                  <p>
                    <span className="message-icon">🤖</span>
                    <span className="message-label">Bot:</span>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {messages.length === 0 && (
          <div className="hero-section">
            <h1>What can I help you with?</h1>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={sendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading}
            className="message-input"
          />
          <button type="submit" disabled={loading} className="send-button">
            {loading ? '⏳ Sending...' : '📤 Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat
