import { Typography } from "antd";
import styles from "./chat.module.css";

const { Text } = Typography;

interface MessageBubbleProps {
  sender: "user" | "chatbot";
  content: string;
  timestamp: Date;
}

export default function MessageBubble({
  sender,
  content,
  timestamp,
}: MessageBubbleProps) {
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (sender === "user") {
    return (
      <div className={styles.messageContainer}>
        <div className={`${styles.messageBubble} ${styles.userMessage}`}>
          <Text className={styles.messageContent}>{content}</Text>
          <Text className={styles.messageTime}>{formatTime(timestamp)}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messageContainer}>
      <div className={styles.chatbotMessage}>
        <div className={styles.chatbotAvatar}>🤖</div>
        <div className={`${styles.messageBubble} ${styles.botMessage}`}>
          <Text className={styles.messageContent}>
            {content.split("\n").map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </Text>
          <Text className={styles.messageTime}>{formatTime(timestamp)}</Text>
        </div>
      </div>
    </div>
  );
}
