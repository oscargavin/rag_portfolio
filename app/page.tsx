"use client"

import { useChat } from "ai/react"
import { useEffect, useRef } from "react"

const parseMarkdown = (text: string) => {
    return text
        // Headers
        .replace(/### (.*?)\n/g, '<span class="header-3">$1</span>\n')
        .replace(/## (.*?)\n/g, '<span class="header-2">$1</span>\n')
        .replace(/# (.*?)\n/g, '<span class="header-1">$1</span>\n')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>')
        // Italic
        .replace(/\*(.*?)\*/g, '<span class="italic">$1</span>')
        // Lists
        .replace(/- (.*?)(\n|$)/g, '<div class="list-item">• $1</div>')
}

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const noMessages = !messages || messages.length === 0

    const handlePrompt = (promptText: string) => {
        const msg = {
            content: promptText,
            role: "user" as const
        }
        append(msg)
    }

    return (
        <main className="terminal-main">
            {/* Terminal Controls */}
            <div className="terminal-header">
                <div className="terminal-controls">
                    <span className="control-dot red"></span>
                    <span className="control-dot yellow"></span>
                    <span className="control-dot green"></span>
                </div>
                <div className="terminal-title-section">
                    <h1>Oscar Gavin Terminal [Version 1.0.0]</h1>
                    <p>Type 'help' for available commands</p>
                </div>
            </div>

            {/* Messages Container */}
            <section className={`terminal-messages ${noMessages ? "" : "populated"}`}>
                {noMessages ? (
                    <div className="welcome-container">
                        <p className="welcome-text">
                            Welcome to Oscar Gavin's terminal interface. Ask me anything about my skills, experience, or interests.
                        </p>
                        <p className="prompt-text">
                            visitor@oscar:~$
                        </p>
                        <div className="help-content">
                            <p>Available commands:</p>
                            <p>$ about         - Learn about Oscar Gavin</p>
                            <p>$ skills        - View technical skills</p>
                            <p>$ projects      - Browse recent projects</p>
                            <p>$ contact       - Get contact information</p>
                            <p>$ clear         - Clear terminal history</p>
                            <p>$ help          - Show this help message</p>
                        </div>
                    </div>
                ) : (
                    <div className="messages-container">
                        {messages.map((message, index) => (
                            <div key={`message-${index}`} className="terminal-line">
                                {message.role === "user" ? (
                                    <div className="user-input">
                                        <span className="prompt">visitor@oscar:~$</span>
                                        <span className="command">{message.content}</span>
                                    </div>
                                ) : (
                                    <div
                                        className="response"
                                        dangerouslySetInnerHTML={{
                                            __html: parseMarkdown(message.content)
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="loading-cursor">
                                <span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </section>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="terminal-form">
                <span className="prompt">visitor@oscar:~$</span>
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    className="terminal-input"
                    placeholder="Type a command..."
                />
            </form>
        </main>
    )
}

export default Home