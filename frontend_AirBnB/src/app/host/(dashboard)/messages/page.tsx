"use client";

import { useState, useEffect } from "react";
import { Layout, List, Avatar, Badge, Empty, Typography, Spin } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ChatWindow from "@/components/chat/ChatWindow";
import styles from "./messages.module.css";

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

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize conversations - chatbot first, then user conversations
    const initialConversations: Conversation[] = [
      {
        id: "chatbot-001",
        name: "Airbnb Tư vấn",
        avatar: "🤖",
        lastMessage: "Chào mừng! Tôi là trợ lý Airbnb. Bạn cần giúp gì?",
        lastMessageTime: new Date(),
        isOnline: true,
        type: "chatbot",
      },
      {
        id: "user-001",
        name: "Lê Thuỵ Dương",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
        lastMessage: "Cảm ơn bạn, mình đã nắm được thông tin phòng rồi",
        lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isOnline: true,
        type: "user",
      },
      {
        id: "user-002",
        name: "Nguyễn Hoàng Nam",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
        lastMessage: "Còn có phòng trống vào cuối tháng không?",
        lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isOnline: false,
        type: "user",
      },
      {
        id: "user-003",
        name: "Trần Văn Tú",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
        lastMessage: "Đã hoàn tất thanh toán. Thông tin nhận phòng?",
        lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isOnline: false,
        type: "user",
      },
    ];

    setConversations(initialConversations);
    // Set chatbot as default selected conversation
    setSelectedConversation(initialConversations[0]);
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    setLoading(true);
    // Simulate loading messages
    setTimeout(() => {
      if (selectedConversation.type === "chatbot") {
        // Initial chatbot messages
        setMessages([
          {
            id: "msg-1",
            sender: "chatbot",
            content:
              "Chào mừng! 👋 Tôi là trợ lý tư vấn Airbnb. Tôi có thể giúp bạn với:\n\n✓ Câu hỏi về việc đặt phòng\n✓ Hướng dẫn sử dụng website\n✓ Thông tin thanh toán\n✓ Chính sách hủy và hoàn tiền\n✓ Các vấn đề khác\n\nBạn cần giúp gì?",
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
          },
        ]);
      } else {
        // Regular user conversation messages
        setMessages([
          {
            id: "msg-1",
            sender: "user",
            content: "Xin chào",
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
          },
          {
            id: "msg-2",
            sender: "user",
            content: "Tôi có vài câu hỏi về phòng của bạn",
            timestamp: new Date(Date.now() - 9 * 60 * 1000),
          },
          {
            id: "msg-3",
            sender: "chatbot",
            content:
              "Tôi vừa nhận được tin nhắn của bạn. Chủ nhà sẽ trả lời trong chốc lát.",
            timestamp: new Date(Date.now() - 8 * 60 * 1000),
          },
        ]);
      }
      setLoading(false);
    }, 300);
  }, [selectedConversation]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa mới";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <Layout className={styles.messagesLayout}>
      <div className={styles.conversationList}>
        <div className={styles.listHeader}>
          <MessageOutlined style={{ fontSize: 18 }} />
          <Text strong>Tin nhắn</Text>
        </div>

        <List
          dataSource={conversations}
          loading={loading}
          renderItem={(conversation) => (
            <div
              key={conversation.id}
              className={`${styles.conversationItem} ${
                selectedConversation?.id === conversation.id
                  ? styles.active
                  : ""
              }`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className={styles.conversationAvatar}>
                {conversation.avatar.includes("http") ? (
                  <Avatar src={conversation.avatar} />
                ) : (
                  <div className={styles.emojiAvatar}>{conversation.avatar}</div>
                )}
                {conversation.isOnline && (
                  <Badge
                    status="success"
                    className={styles.onlineBadge}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                    }}
                  />
                )}
              </div>

              <div className={styles.conversationInfo}>
                <div className={styles.conversationHeader}>
                  <Text strong className={styles.conversationName}>
                    {conversation.name}
                  </Text>
                  <Text className={styles.conversationTime}>
                    {formatTimeAgo(conversation.lastMessageTime)}
                  </Text>
                </div>
                <Text
                  ellipsis
                  className={styles.lastMessage}
                  title={conversation.lastMessage}
                >
                  {conversation.lastMessage}
                </Text>
              </div>
            </div>
          )}
        />
      </div>

      <div className={styles.chatArea}>
        {selectedConversation && !loading ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            onMessagesChange={setMessages}
          />
        ) : (
          <div className={styles.emptyState}>
            <Spin />
            <Text>Đang tải...</Text>
          </div>
        )}
      </div>
    </Layout>
  );
}
