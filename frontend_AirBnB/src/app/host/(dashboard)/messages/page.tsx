"use client";

import { useEffect, useState, useRef } from "react";
import {
  Layout,
  List,
  Avatar,
  Badge,
  Typography,
  Spin,
  message as antdMessage,
  Input,
  Button,
  Popover,
} from "antd";
import {
  MessageOutlined,
  SendOutlined,
  PictureOutlined,
  SmileOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { getAccess, postAccess } from "@/helper/api";
import { useChatSocket } from "@/components/providers/ChatSocketProvider";
import ChatbotWidget from "@/components/chat/ChatbotWidget";
import styles from "./messages.module.css";

const { Text } = Typography;

interface Message {
  id: string;
  sender: "host" | "guest" | "chatbot";
  content: string;
  timestamp: Date;
  relatedQuestions?: string[];
}

type ChatbotMessage = {
  id: string;
  sender: "user" | "chatbot";
  content: string;
  timestamp: Date;
  relatedQuestions?: string[];
};

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  isOnline: boolean;
  type: "user" | "chatbot";
  conversationId?: string;
  hasUnread?: boolean;
  hostUserId?: string;
  guestUserId?: string;
}

type ConversationDto = {
  _id: string;
  guest_id: { _id: string; name?: string; avatar_url?: string };
  host_id: { _id: string; name?: string; avatar_url?: string };
  last_message_preview?: string;
  last_message_at?: string;
  last_updated?: string;
};

type MessageDto = {
  _id: string;
  conversation_id: string;
  sender_id: { _id: string };
  content: string;
  sent_at: string;
};

export default function MessagesPage() {
  const { socket } = useChatSocket();
  const [antdMsgApi, contextHolder] = antdMessage.useMessage();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [typingByOther, setTypingByOther] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const PAGE_SIZE = 10;
  const [chatbotMessages, setChatbotMessages] = useState<ChatbotMessage[]>([]);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const list = (await getAccess("conservations/my")) as ConversationDto[];

        const chatbot: Conversation = {
          id: "chatbot-001",
          name: "Airbnb Tư vấn",
          avatar: "🤖",
          lastMessage: "Chào mừng! Tôi là trợ lý Airbnb. Bạn cần giúp gì?",
          lastMessageTime: new Date(),
          isOnline: true,
          type: "chatbot",
        };

        const mapped: Conversation[] = Array.isArray(list)
          ? list.map((c) => ({
              id: c._id,
              conversationId: c._id,
              hostUserId: c.host_id?._id,
              guestUserId: c.guest_id?._id,
              name: `Khách: ${c.guest_id?.name || "Khách"}`,
              avatar: c.guest_id?.avatar_url || "",
              lastMessage: c.last_message_preview || "",
              lastMessageTime: new Date(c.last_message_at || c.last_updated || Date.now()),
              isOnline: true,
              type: "user",
              hasUnread: false,
            }))
          : [];

        const all = [chatbot, ...mapped];
        setConversations(all);
        setSelectedConversation(chatbot);
        setChatbotMessages([
          {
            id: "msg-1",
            sender: "chatbot",
            content:
              "Chào mừng! 👋 Tôi là trợ lý tư vấn Airbnb cho Host.\n\nBạn có thể hỏi tôi về:\n\n• Cách trả lời tin nhắn khách hiệu quả\n• Chính sách huỷ/hoàn tiền\n• Gợi ý nâng cao trải nghiệm khách\n\nBạn muốn hỏi gì?",
            timestamp: new Date(),
          },
        ]);
      } catch (e: any) {
        antdMsgApi.error(e?.response?.data?.message || "Không thể tải danh sách tin nhắn");
        const chatbotOnly: Conversation[] = [
          {
            id: "chatbot-001",
            name: "Airbnb Tư vấn",
            avatar: "🤖",
            lastMessage: "Chào mừng! Tôi là trợ lý Airbnb. Bạn cần giúp gì?",
            lastMessageTime: new Date(),
            isOnline: true,
            type: "chatbot",
          },
        ];
        setConversations(chatbotOnly);
        setSelectedConversation(chatbotOnly[0]);
        setChatbotMessages([
          {
            id: "msg-1",
            sender: "chatbot",
            content:
              "Chào mừng! 👋 Tôi là trợ lý tư vấn Airbnb cho Host.\n\nBạn có thể hỏi tôi về:\n\n• Cách trả lời tin nhắn khách hiệu quả\n• Chính sách huỷ/hoàn tiền\n• Gợi ý nâng cao trải nghiệm khách\n\nBạn muốn hỏi gì?",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [antdMsgApi]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;
      setLoading(true);

      if (selectedConversation.type === "chatbot") {
        setLoading(false);
        return;
      }

      try {
        const msgs = (await getAccess("messages", {
          conversationId: selectedConversation.conversationId,
          limit: PAGE_SIZE,
        })) as MessageDto[];

        const hostUserId = selectedConversation.hostUserId;

        const baseList = Array.isArray(msgs) ? msgs : [];
        const mapped: Message[] = baseList.map((m) => ({
          id: m._id,
          sender: m.sender_id?._id === hostUserId ? "host" : "guest",
          content: m.content,
          timestamp: new Date(m.sent_at),
        }));

        setMessages(mapped);
        setHasMore(baseList.length === PAGE_SIZE);
      } catch (e: any) {
        antdMsgApi.error(e?.response?.data?.message || "Không thể tải hội thoại với khách");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversation, antdMsgApi]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (payload: { message: MessageDto }) => {
      const msg = payload.message;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.conversationId === msg.conversation_id) {
            return {
              ...c,
              lastMessage: msg.content,
              lastMessageTime: new Date(msg.sent_at),
              hasUnread:
                !selectedConversation || selectedConversation.conversationId !== msg.conversation_id,
            };
          }
          return c;
        }),
      );

      if (selectedConversation?.conversationId === msg.conversation_id) {
        setMessages((prev) => [
          ...prev,
          {
            id: msg._id,
            sender: "guest",
            content: msg.content,
            timestamp: new Date(msg.sent_at),
          },
        ]);
      }
    };

    const onTyping = (payload: { conversationId: string; isTyping: boolean }) => {
      if (!selectedConversation) return;
      if (payload.conversationId !== selectedConversation.conversationId) return;
      setTypingByOther(!!payload.isTyping);
    };

    socket.on("chat:new_message", onNew);
    socket.on("chat:typing", onTyping);
    return () => {
      socket.off("chat:new_message", onNew);
      socket.off("chat:typing", onTyping);
    };
  }, [socket, selectedConversation]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setTypingByOther(false);
    if (conversation.type === "user") {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id
            ? {
                ...c,
                hasUnread: false,
              }
            : c,
        ),
      );
    }
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

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });

  const handleChooseFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...picked].slice(0, 10));
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const emitTyping = (isTyping: boolean) => {
    if (!socket || !selectedConversation || !selectedConversation.guestUserId) return;
    socket.emit("chat:typing", {
      conversationId: selectedConversation.conversationId,
      receiverId: selectedConversation.guestUserId,
      isTyping,
    });
  };

  const emojiList = ["😀", "😁", "😂", "😍", "🥰", "😅", "😢", "😡", "👍", "🙏", "🎉", "❤️"];
  const emojiContent = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, padding: 6 }}>
      {emojiList.map((e) => (
        <button
          key={e}
          style={{
            border: "1px solid #eef2f7",
            background: "#fff",
            borderRadius: 10,
            width: 32,
            height: 32,
            cursor: "pointer",
            fontSize: 18,
          }}
          onClick={() => setDraft((prev) => prev + e)}
          type="button"
        >
          {e}
        </button>
      ))}
    </div>
  );

  return (
    <Layout className={styles.messagesLayout}>
      {contextHolder}
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
                selectedConversation?.id === conversation.id ? styles.active : ""
              }`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className={styles.conversationAvatar}>
                {conversation.avatar && conversation.avatar.includes("http") ? (
                  <Avatar src={conversation.avatar} />
                ) : (
                  <div className={styles.emojiAvatar}>{conversation.avatar || "👤"}</div>
                )}
                {conversation.type === "chatbot" && conversation.isOnline && (
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
                {conversation.hasUnread && conversation.type === "user" && (
                  <Badge
                    color="red"
                    style={{ position: "absolute", top: 0, right: 0 }}
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
          selectedConversation.type === "chatbot" ? (
            <ChatbotWidget messages={chatbotMessages} onMessagesChange={setChatbotMessages} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  backgroundColor: "#f5f7fb",
                }}
                ref={messagesContainerRef}
                onScroll={async (e) => {
                  const el = e.currentTarget;
                  if (el.scrollTop < 40 && !isLoadingMore && hasMore && !loading && selectedConversation) {
                    const oldest = messages[0];
                    if (!oldest) return;
                    const before = oldest.timestamp.toISOString();
                    try {
                      setIsLoadingMore(true);
                      const prevHeight = el.scrollHeight;
                      const older = (await getAccess("messages", {
                        conversationId: selectedConversation.conversationId,
                        limit: PAGE_SIZE,
                        before,
                      })) as MessageDto[];
                      const list = Array.isArray(older) ? older : [];
                      if (list.length > 0) {
                        setMessages((prev) => [
                          ...list.map((m) => ({
                            id: m._id,
                            sender: m.sender_id?._id === selectedConversation.hostUserId ? "host" : "guest",
                            content: m.content,
                            timestamp: new Date(m.sent_at),
                          })),
                          ...prev,
                        ]);
                        setHasMore(list.length === PAGE_SIZE);
                        setTimeout(() => {
                          const diff = el.scrollHeight - prevHeight;
                          el.scrollTop = diff;
                        }, 0);
                      } else {
                        setHasMore(false);
                      }
                    } catch (err) {
                      console.error("load older host messages error", err);
                    } finally {
                      setIsLoadingMore(false);
                    }
                  }
                }}
              >
                {messages.map((m) => {
                  const isHost = m.sender === "host";
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: isHost ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "10px 14px",
                          borderRadius: 16,
                          borderTopLeftRadius: isHost ? 16 : 6,
                          borderTopRightRadius: isHost ? 6 : 16,
                          backgroundColor: isHost ? "#1677ff" : "#fff",
                          color: isHost ? "#fff" : "#0d141b",
                          boxShadow: "0 1px 2px rgba(15,23,42,0.15)",
                        }}
                      >
                        <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            textAlign: "right",
                            opacity: 0.8,
                          }}
                        >
                          {m.timestamp.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typingByOther && (
                  <div style={{ marginTop: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#4c739a",
                        fontSize: 12,
                      }}
                    >
                      <Avatar
                        size={22}
                        src={
                          selectedConversation?.guestUserId
                            ? conversations.find((c) => c.id === selectedConversation.id)?.avatar
                            : undefined
                        }
                        style={{ background: "#e7edf3", color: "#0d141b" }}
                      >
                        {(selectedConversation?.name || "K").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <span>Khách đang nhập...</span>
                      <span className={styles.dots}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {selectedConversation.type === "user" && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #e5e7eb",
                    backgroundColor: "#fff",
                  }}
                >
                  <Input.TextArea
                    value={draft}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft(v);
                      emitTyping(true);
                      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = window.setTimeout(() => emitTyping(false), 900);
                    }}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder="Nhập tin nhắn trả lời khách..."
                    style={{ marginBottom: 8 }}
                  />

                  {selectedFiles.length > 0 && (
                    <div style={{ display: "flex", gap: 10, paddingBottom: 8, overflowX: "auto" }}>
                      {selectedFiles.map((f, idx) => (
                        <div
                          key={`${f.name}-${idx}`}
                          style={{
                            position: "relative",
                            width: 72,
                            height: 72,
                            borderRadius: 12,
                            overflow: "hidden",
                            border: "1px solid #e5e7eb",
                            flexShrink: 0,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              border: "none",
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          onChange={(e) => handleChooseFiles(e.target.files)}
                        />
                        <Button icon={<PictureOutlined />} type="text" />
                      </label>
                      <Popover content={emojiContent} trigger="click" placement="topLeft">
                        <Button icon={<SmileOutlined />} type="text" />
                      </Popover>
                      <Button icon={<PaperClipOutlined />} type="text" disabled />
                    </div>

                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      disabled={
                        !socket ||
                        (!draft.trim() && selectedFiles.length === 0) ||
                        !selectedConversation.conversationId
                      }
                      onClick={async () => {
                        if (!selectedConversation.conversationId || !socket) return;
                        const text = draft.trim();
                        const hasImages = selectedFiles.length > 0;
                        if (!text && !hasImages) return;

                        const now = new Date();
                        const tempId = `host_tmp_${now.getTime()}`;
                        setMessages((prev) => [
                          ...prev,
                          { id: tempId, sender: "host", content: text, timestamp: now },
                        ]);
                        setDraft("");

                        try {
                          let imageUrls: string[] = [];
                          if (hasImages) {
                            const base64s = await Promise.all(selectedFiles.map(fileToBase64));
                            const res = await postAccess("upload/images", {
                              images: base64s,
                              folder: "chat",
                            });
                            imageUrls = res?.urls || [];
                          }
                          setSelectedFiles([]);

                          socket.emit("chat:send", {
                            conversationId: selectedConversation.conversationId,
                            text,
                            image_urls: imageUrls,
                            clientTempId: tempId,
                          });
                        } catch (e: any) {
                          antdMsgApi.error(
                            e?.response?.data?.message || "Không thể upload ảnh / gửi tin nhắn",
                          );
                        }
                      }}
                    >
                      Gửi
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
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

