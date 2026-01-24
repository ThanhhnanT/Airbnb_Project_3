"use client";

import { useState, useRef, useEffect } from "react";
import { Button, message as antMessage, Spin, Typography, Empty } from "antd";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import styles from "./chat.module.css";

const { Text } = Typography;

interface Message {
  id: string;
  sender: "user" | "chatbot";
  content: string;
  timestamp: Date;
  relatedQuestions?: string[];
}

interface ChatbotWidgetProps {
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

const CHATBOT_API = "http://localhost:8000/chatbot/ask_question";

export default function ChatbotWidget({
  messages,
  onMessagesChange,
}: ChatbotWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const askChatbot = async (question: string) => {
    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch(CHATBOT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          user_type: "host",
          category: undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Lỗi khi gọi API chatbot");
      }

      const data = await response.json();

      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: "user",
        content: question,
        timestamp: new Date(),
      };

      // Add chatbot response
      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "chatbot",
        content: data.answer || "Xin lỗi, tôi không thể xử lý câu hỏi này.",
        timestamp: new Date(),
        relatedQuestions: data.related_questions || [],
      };

      onMessagesChange([...messages, userMessage, botMessage]);
    } catch (error: any) {
      const errorMsg =
        error.message || "Không thể kết nối đến chatbot service";
      setApiError(errorMsg);
      antMessage.error(`Lỗi: ${errorMsg}`);
      console.error("Chatbot error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (text: string) => {
    askChatbot(text);
  };

  const handleRelatedQuestion = (question: string) => {
    askChatbot(question);
  };

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <Empty
            description="Chưa có tin nhắn"
            style={{
              marginTop: "100px",
            }}
          />
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                <MessageBubble
                  sender={msg.sender}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />

                {/* Show related questions after bot message */}
                {msg.sender === "chatbot" &&
                  msg.relatedQuestions &&
                  msg.relatedQuestions.length > 0 &&
                  idx === messages.length - 1 && (
                    <div className={styles.relatedQuestionsContainer}>
                      <Text className={styles.suggestionsLabel}>
                        Câu hỏi liên quan:
                      </Text>
                      <div className={styles.relatedQuestionsGrid}>
                        {msg.relatedQuestions.map((q, qIdx) => (
                          <Button
                            key={qIdx}
                            onClick={() => handleRelatedQuestion(q)}
                            className={styles.relatedQuestionButton}
                            disabled={loading}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}

            {loading && (
              <div className={styles.loadingContainer}>
                <Spin />
                <Text>Đang xử lý...</Text>
              </div>
            )}

            {apiError && (
              <div className={styles.errorContainer}>
                <Text type="danger">{apiError}</Text>
                <Button
                  type="primary"
                  danger
                  size="small"
                  onClick={() => setApiError(null)}
                  style={{ marginTop: 8 }}
                >
                  Đóng
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={loading || !!apiError}
        loading={loading}
        placeholder="Hỏi tôi về Airbnb..."
      />
    </div>
  );
}
