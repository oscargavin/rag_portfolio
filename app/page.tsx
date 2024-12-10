"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import MatrixBackground from "./components/MatrixBackground";

const parseMarkdown = (text: string) => {
  return (
    text
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
  );
};

const Home = () => {
  const { append, isLoading, messages, input, handleInputChange, setMessages } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Handle keyboard visibility
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      // Check if we're on mobile
      if (window.innerWidth <= 768) {
        // If the visual viewport height is significantly less than the window height,
        // we can assume the keyboard is visible
        const keyboardVisible =
          window.visualViewport.height < window.innerHeight * 0.8;
        setIsKeyboardVisible(keyboardVisible);
      }
    };

    // Listen to visual viewport changes
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);

  // Unified command and submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input.trim(); // Store input before clearing

    // Clear input immediately after submission
    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);

    // Show user input immediately
    append({
      content: userInput,
      role: "user",
    });

    if (userInput.toLowerCase() === "download cv") {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, { content: userInput, role: "user" }],
          }),
        });

        const data = await response.json();

        if (data.download) {
          // Trigger download
          const link = document.createElement("a");
          link.href = data.file;
          link.download = "oscar_gavin_cv.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Show confirmation message only
          append({
            content:
              "📄 CV download started. The file should begin downloading automatically.",
            role: "assistant",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        append({
          content:
            "❌ Sorry, there was an error downloading the CV. Please try again.",
          role: "assistant",
        });
      }
      return;
    }

    // Handle all other commands through normal chat flow
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { content: input, role: "user" }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Let the useChat hook handle the streaming response
      return response;
    } catch (error) {
      console.error("Error:", error);
      append({
        content:
          "❌ Sorry, there was an error processing your request. Please try again.",
        role: "assistant",
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + L to clear screen
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        setMessages([]);
      }
      // Ctrl + C to cancel/clear input
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        const cancelMessage = {
          content: "^C",
          role: "user" as const,
        };
        append(cancelMessage);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setMessages, append]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const noMessages = !messages || messages.length === 0;

  const handlePrompt = (promptText: string) => {
    const msg = {
      content: promptText,
      role: "user" as const,
    };
    append(msg);
  };

  return (
    <>
      <MatrixBackground />
      <main className="terminal-main" role="main">
        {/* Terminal Controls - Add aria-label */}
        <div className="terminal-header" role="banner">
          <div className="terminal-controls" aria-label="Window controls">
            {/* Make decorative dots not focusable */}
            <span
              className="control-dot red"
              aria-hidden="true"
              role="presentation"
            ></span>
            <span
              className="control-dot yellow"
              aria-hidden="true"
              role="presentation"
            ></span>
            <span
              className="control-dot green"
              aria-hidden="true"
              role="presentation"
            ></span>
          </div>
          <div className="terminal-title-section">
            <h1>Oscar Gavin Terminal [Version 1.2.0]</h1>
            <p>Type 'help' for available commands</p>
          </div>
        </div>

        {/* Messages Container - Add appropriate ARIA labels */}
        <section
          className={`terminal-messages ${noMessages ? "" : "populated"} ${isKeyboardVisible ? "keyboard-visible" : ""
            }`}
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
        >
          {noMessages ? (
            <div className="welcome-container">
              <p className="welcome-text">
                Welcome to Oscar Gavin's terminal interface. Ask me anything about
                my skills, experience, or interests.
              </p>
              <p className="prompt-text" aria-hidden="true">
                visitor@oscar:~$
              </p>
              <div className="help-content" role="list">
                <p role="listitem">Available commands:</p>
                {/* Add role="listitem" to each command */}
                <p role="listitem">$ about - Learn about Oscar Gavin</p>
                <p role="listitem">$ skills - View technical skills</p>
                <p role="listitem">$ projects - Browse recent projects</p>
                <p role="listitem">$ contact - Get contact information</p>
                <p role="listitem">$ download cv - Download my CV</p>
                <p role="listitem">$ clear - Clear terminal history</p>
                <p role="listitem">$ help - Show this help message</p>
              </div>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={`message-${index}`}
                  className="terminal-line"
                  role="listitem"
                >
                  {message.role === "user" ? (
                    <div className="user-input">
                      <span className="prompt" aria-hidden="true">
                        visitor@oscar:~$
                      </span>
                      <span className="command">{message.content}</span>
                    </div>
                  ) : (
                    <div
                      className="response"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(message.content),
                      }}
                    />
                  )}
                </div>
              ))}
              {isLoading && (
                <div
                  className="loading-cursor"
                  role="status"
                  aria-label="Loading"
                >
                  <span aria-hidden="true"></span>
                </div>
              )}
              <div ref={messagesEndRef} tabIndex={-1} />
            </div>
          )}
        </section>

        {/* Input Form - Add appropriate ARIA labels */}
        <form onSubmit={handleSubmit} className="terminal-form" role="form">
          <span className="prompt" aria-hidden="true">
            visitor@oscar:~$
          </span>
          <input
            id="terminal-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            className="terminal-input"
            placeholder="Type a command..."
            aria-label="Terminal input"
          />
        </form>
      </main>
    </>

  );
};

export default Home;
