import { useState } from "react";
import { Input, Button, Space } from "antd";
import { SendOutlined } from "@ant-design/icons";
import styles from "./chat.module.css";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  loading = false,
  placeholder = "Nhập tin nhắn...",
  defaultValue = "",
}: ChatInputProps) {
  const [message, setMessage] = useState(defaultValue);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <Space.Compact className={styles.inputWrapper}>
        <Input.TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={1}
          maxLength={500}
          className={styles.inputField}
          autoFocus
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!message.trim() || disabled || loading}
          loading={loading}
          className={styles.sendButton}
        >
          Gửi
        </Button>
      </Space.Compact>
      <div className={styles.charCount}>
        <span>{message.length}/500</span>
      </div>
    </div>
  );
}
