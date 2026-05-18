import { useState, useEffect, useRef } from "react";
import "./App.css";

import ReactMarkdown from "react-markdown";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";


function App() {

  const [message, setMessage] = useState("");

  const [allChats, setAllChats] = useState(() => {

    const saved = localStorage.getItem("allChats");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: Date.now(),
            title: "New Chat",
            messages: [],
          },
        ];
  });

  const [currentChatId, setCurrentChatId] = useState(
    allChats[0].id
  );

  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  const currentChat = allChats.find(
    (chat) => chat.id === currentChatId
  );

  const copyCode = async (code) => {

    try {

      await navigator.clipboard.writeText(code);

      alert("Code copied!");

    } catch (err) {

      console.error("Copy failed", err);
    }
  };

  useEffect(() => {

    localStorage.setItem(
      "allChats",
      JSON.stringify(allChats)
    );

  }, [allChats]);

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [currentChat]);

  const updateCurrentChatMessages = (messages) => {

    setAllChats((prev) =>
      prev.map((chat) => {

        if (chat.id === currentChatId) {

          let updatedTitle = chat.title;

          if (
            chat.title === "New Chat" &&
            messages.length > 0
          ) {
            updatedTitle =
              messages[0].text.slice(0, 30);
          }

          return {
            ...chat,
            title: updatedTitle,
            messages,
          };
        }

        return chat;
      })
    );
  };

  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMessage = {
      sender: "You",
      text: message,
    };

    const updatedMessages = [
      ...currentChat.messages,
      userMessage,
    ];

    updateCurrentChatMessages(updatedMessages);

    setLoading(true);

    try {

      const response = await fetch(
        "https://ai-chatbot-project-lmat.onrender.com/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
          }),
        }
      );

      const data = await response.json();

      updateCurrentChatMessages([
        ...updatedMessages,
        {
          sender: "AI",
          text: data.response || "No response from AI",
        },
      ]);

    } catch (error) {

      console.error(error);

      updateCurrentChatMessages([
        ...updatedMessages,
        {
          sender: "AI",
          text: "Error connecting to backend",
        },
      ]);
    }

    setLoading(false);

    setMessage("");
  };

  const createNewChat = () => {

    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setAllChats((prev) => [
      newChat,
      ...prev,
    ]);

    setCurrentChatId(newChat.id);
  };

  const deleteChat = (chatId) => {

    if (allChats.length === 1) {
      alert("At least one chat required");
      return;
    }

    const filteredChats =
      allChats.filter(
        (chat) => chat.id !== chatId
      );

    setAllChats(filteredChats);

    if (currentChatId === chatId) {
      setCurrentChatId(
        filteredChats[0].id
      );
    }
  };

  return (

    <div className="main-container">

      <div className="sidebar">

        <button
          className="new-chat-btn"
          onClick={createNewChat}
        >
          + New Chat
        </button>

        {allChats.map((chat) => (

          <div
            key={chat.id}
            className={
              chat.id === currentChatId
                ? "chat-item active-chat"
                : "chat-item"
            }
          >

            <span
              onClick={() =>
                setCurrentChatId(chat.id)
              }
              className="chat-title"
            >
              {chat.title}
            </span>

            <button
              className="delete-btn"
              onClick={() =>
                deleteChat(chat.id)
              }
            >
              🗑
            </button>

          </div>

        ))}

      </div>

      <div className="app">

        <h1>AI Chatbot</h1>

        <div className="chat-box">

          {currentChat.messages.map(
            (msg, index) => (

              <div
                key={msg.text + index}
                className={
                  msg.sender === "You"
                    ? "message user-message"
                    : "message ai-message"
                }
              >

                <strong>{msg.sender}:</strong>

                <ReactMarkdown
                  components={{

                    code({
                      className,
                      children,
                      ...props
                    }) {

                      const match =
                        /language-(\w+)/.exec(
                          className || ""
                        );

                      const codeString =
                        String(children).replace(
                          /\n$/,
                          ""
                        );

                      return match ? (

                        <div className="code-block">

                          <button
                            className="copy-btn"
                            onClick={() =>
                              copyCode(codeString)
                            }
                          >
                            Copy
                          </button>

                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {codeString}
                          </SyntaxHighlighter>

                        </div>

                      ) : (

                        <code
                          className={className}
                          {...props}
                        >
                          {children}
                        </code>

                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>

              </div>
            )
          )}

          {loading && (
            <div className="message ai-message">
              <strong>AI:</strong> Typing...
            </div>
          )}

          <div ref={chatEndRef}></div>

        </div>

        <div className="input-area">

          <input
            type="text"
            placeholder="Ask anything..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>
  );
}

export default App;