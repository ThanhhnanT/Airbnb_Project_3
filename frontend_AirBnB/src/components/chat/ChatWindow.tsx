import { useRef, useEffect } from "react";
import { Divider, Typography } from "antd";
import MessageBubble from "./MessageBubble";
import ChatbotWidget from "./ChatbotWidget";
import styles from "./chat.module.css";

const { Text } = Typography;

interface Message {
  id: string;
  sender: "user" | "chatbot";
  content: string;
  timestamp: Date;
  relatedQuestions?: string[];
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  isOnline: boolean;
  type: "user" | "chatbot";
}

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

export default function ChatWindow({
  conversation,
  messages,
  onMessagesChange,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div>
          <Text strong className={styles.chatTitle}>
            {conversation.name}
          </Text>
          <br />
          <Text type="secondary" className={styles.chatStatus}>
            {conversation.isOnline ? "Đang hoạt động" : "Offline"}
          </Text>
        </div>
      </div>

      <Divider style={{ margin: 0 }} />

      {conversation.type === "chatbot" ? (
        <ChatbotWidget messages={messages} onMessagesChange={onMessagesChange} />
      ) : (
        <div className={styles.messagesArea}>
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                sender={msg.sender}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
