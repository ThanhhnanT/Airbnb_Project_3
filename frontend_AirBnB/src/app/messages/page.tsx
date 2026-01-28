"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Layout,
  List,
  Popover,
  Spin,
  Tag,
  Typography,
  message as antdMessage,
} from "antd";
import {
  CalendarOutlined,
  CloseOutlined,
  PaperClipOutlined,
  PictureOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { getAccess, postAccess } from "@/helper/api";
import { useChatSocket } from "@/components/providers/ChatSocketProvider";
import styles from "./messages.module.css";

const { Text, Title } = Typography;

type UserMini = { _id: string; name?: string; avatar_url?: string };
type BookingMini = {
  _id: string;
  check_in: string;
  check_out: string;
  status: string;
  listing_id?: { _id: string; title?: string; city?: string; country?: string; images?: string[] };
  host_id?: UserMini;
  guest_id?: UserMini;
};

type ConversationDto = {
  _id: string;
  booking_id: BookingMini | string;
  guest_id: UserMini;
  host_id: UserMini;
  listing_id?: { _id: string; title?: string; city?: string; country?: string; images?: string[] };
  last_message_preview?: string;
  last_message_at?: string;
  last_updated?: string;
};

type MessageDto = {
  _id: string;
  conversation_id: string;
  sender_id: UserMini;
  receiver_id: UserMini;
  content: string;
  image_urls?: string[];
  sent_at: string;
  is_read: boolean;
  read_at?: string;
  client_temp_id?: string;
};

type UiMessage = MessageDto & { _localStatus?: "sending" | "sent" | "error" };

export default function GuestMessagesPage() {
  const searchParams = useSearchParams();
  const bookingIdFromQuery = searchParams.get("booking") || undefined;
  const { socket, connected } = useChatSocket();
  const [antdMsgApi, contextHolder] = antdMessage.useMessage();

  const [selectedConversation, setSelectedConversation] = useState<ConversationDto | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [booking, setBooking] = useState<BookingMini | null>(null);
  const [typingByOther, setTypingByOther] = useState(false);

  const [draft, setDraft] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isPrependingRef = useRef(false);
  const PAGE_SIZE = 10;

  const bookingId = useMemo(() => {
    if (!selectedConversation) return null;
    return typeof selectedConversation.booking_id === "string"
      ? selectedConversation.booking_id
      : selectedConversation.booking_id?._id;
  }, [selectedConversation]);

  const otherUser = useMemo(() => {
    if (!selectedConversation) return null;
    // Guest page: other user is host
    return selectedConversation.host_id;
  }, [selectedConversation]);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        const list = (await getAccess("conservations/my")) as ConversationDto[];
        const next = Array.isArray(list) ? list : [];
        setConversations(next);
        if (!selectedConversation && next.length > 0 && !bookingIdFromQuery) {
          setSelectedConversation(next[0]);
        }
      } catch {
        setConversations([]);
      } finally {
        setLoadingConversations(false);
      }
    };
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ensureSelected = async () => {
      if (!bookingIdFromQuery) return;
      try {
        const conv = (await getAccess(`conservations/by-booking/${bookingIdFromQuery}`)) as ConversationDto;
        setSelectedConversation(conv);
        setConversations((prev) => (prev.some((c) => c._id === conv._id) ? prev : [conv, ...prev]));
      } catch (e: any) {
        antdMsgApi.error(e?.response?.data?.message || "Không thể mở cuộc trò chuyện");
      }
    };
    ensureSelected();
  }, [bookingIdFromQuery, antdMsgApi]);

  useEffect(() => {
    const loadBookingAndMessages = async () => {
      if (!selectedConversation) return;
      try {
        setLoadingMessages(true);

        if (bookingId) {
          const b = (await getAccess(`bookings/${bookingId}`)) as BookingMini;
          setBooking(b);
        } else {
          setBooking(null);
        }

        const msgs = (await getAccess("messages", {
          conversationId: selectedConversation._id,
          limit: PAGE_SIZE,
        })) as MessageDto[];
        const list = Array.isArray(msgs) ? msgs : [];
        setMessages(list.map((m) => ({ ...m, _localStatus: "sent" })));
        setHasMore(list.length === PAGE_SIZE);

        socket?.emit("chat:read", { conversationId: selectedConversation._id });
        try {
          await postAccess("messages/mark-read", { conversationId: selectedConversation._id });
        } catch {}
      } catch (e: any) {
        antdMsgApi.error(e?.response?.data?.message || "Không thể tải tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    };
    loadBookingAndMessages().then(() => {
      // scroll to bottom after initial load
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "auto" });
      }, 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?._id]);

  useEffect(() => {
    if (isPrependingRef.current) {
      // prevent jump to bottom when prepending older messages
      isPrependingRef.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingByOther]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (payload: { message: MessageDto }) => {
      setMessages((prev) => [...prev, { ...payload.message, _localStatus: "sent" }]);
    };
    const onAck = (payload: { clientTempId?: string; message: MessageDto }) => {
      setMessages((prev) => {
        const idx = payload.clientTempId
          ? prev.findIndex((m) => m.client_temp_id === payload.clientTempId && m._localStatus === "sending")
          : -1;
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...payload.message, _localStatus: "sent" };
          return next;
        }
        return [...prev, { ...payload.message, _localStatus: "sent" }];
      });
    };
    const onTyping = (payload: { conversationId: string; isTyping: boolean }) => {
      if (!selectedConversation) return;
      if (payload.conversationId !== selectedConversation._id) return;
      setTypingByOther(!!payload.isTyping);
    };
    const onRead = (payload: { conversationId: string; readerId: string }) => {
      if (!selectedConversation) return;
      if (payload.conversationId !== selectedConversation._id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.is_read) return m;
          if (m.receiver_id?._id === payload.readerId) {
            return { ...m, is_read: true, read_at: new Date().toISOString() };
          }
          return m;
        }),
      );
    };
    const onError = (payload: { clientTempId?: string; message: string }) => {
      if (payload?.clientTempId) {
        setMessages((prev) =>
          prev.map((m) => (m.client_temp_id === payload.clientTempId ? { ...m, _localStatus: "error" } : m)),
        );
      }
      antdMsgApi.error(payload?.message || "Gửi tin nhắn thất bại");
    };

    socket.on("chat:new_message", onNew);
    socket.on("chat:message_ack", onAck);
    socket.on("chat:typing", onTyping);
    socket.on("chat:read", onRead);
    socket.on("chat:error", onError);

    return () => {
      socket.off("chat:new_message", onNew);
      socket.off("chat:message_ack", onAck);
      socket.off("chat:typing", onTyping);
      socket.off("chat:read", onRead);
      socket.off("chat:error", onError);
    };
  }, [socket, selectedConversation, antdMsgApi]);

  const handleSelectConversation = (conversation: ConversationDto) => {
    setSelectedConversation(conversation);
  };

  const formatTimeAgo = (dateLike?: string): string => {
    if (!dateLike) return "";
    const date = new Date(dateLike);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Vừa mới";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("vi-VN");
  };

  const formatClock = (dateLike: string): string => {
    const d = new Date(dateLike);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const getListingPhoto = () => {
    const fromBooking = booking?.listing_id?.images?.[0];
    const fromConversation = selectedConversation?.listing_id?.images?.[0];
    return fromBooking || fromConversation || "";
  };

  const getListingTitle = () => {
    return booking?.listing_id?.title || selectedConversation?.listing_id?.title || "Đặt phòng";
  };

  const getDateRange = () => {
    if (!booking?.check_in || !booking?.check_out) return "";
    const ci = dayjs(booking.check_in).format("DD [thg] MM");
    const co = dayjs(booking.check_out).format("DD [thg] MM, YYYY");
    return `${ci} - ${co}`;
  };

  const statusTag = () => {
    const status = booking?.status;
    if (!status) return null;
    if (status === "confirmed") return <Tag color="green">Đã xác nhận</Tag>;
    if (status === "pending") return <Tag color="gold">Chờ xác nhận</Tag>;
    if (status === "completed") return <Tag>Đã hoàn thành</Tag>;
    if (status === "cancelled") return <Tag color="red">Đã hủy</Tag>;
    return <Tag>{status}</Tag>;
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });

  const emitTyping = (isTyping: boolean) => {
    if (!socket || !selectedConversation || !otherUser?._id) return;
    socket.emit("chat:typing", {
      conversationId: selectedConversation._id,
      receiverId: otherUser._id,
      isTyping,
    });
  };

  const handleDraftChange = (v: string) => {
    setDraft(v);
    emitTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => emitTyping(false), 900);
  };

  const handleChooseFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...picked].slice(0, 10));
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!selectedConversation || !socket) return;
    const content = draft.trim();
    const hasImages = selectedFiles.length > 0;
    if (!content && !hasImages) return;

    emitTyping(false);

    const clientTempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const optimistic: UiMessage = {
      _id: clientTempId,
      conversation_id: selectedConversation._id,
      sender_id: { _id: "me" },
      receiver_id: otherUser || { _id: "other" },
      content,
      image_urls: [],
      sent_at: new Date().toISOString(),
      is_read: false,
      client_temp_id: clientTempId,
      _localStatus: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      let imageUrls: string[] = [];
      if (hasImages) {
        const base64s = await Promise.all(selectedFiles.map(fileToBase64));
        const res = await postAccess("upload/images", { images: base64s, folder: "chat" });
        imageUrls = res?.urls || [];
      }
      setSelectedFiles([]);

      socket.emit("chat:send", {
        conversationId: selectedConversation._id,
        text: content,
        image_urls: imageUrls,
        clientTempId,
      });
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) => (m.client_temp_id === clientTempId ? { ...m, _localStatus: "error" } : m)),
      );
      antdMsgApi.error(e?.response?.data?.message || "Không thể upload ảnh / gửi tin nhắn");
    }
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
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: 18,
          }}
          onClick={() => handleDraftChange(draft + e)}
          type="button"
        >
          {e}
        </button>
      ))}
    </div>
  );

  const isOutgoing = (m: UiMessage) => {
    return m.sender_id?._id !== selectedConversation?.host_id?._id;
  };

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ marginBottom: 4 }}>
          Tin nhắn
        </Title>
        <Text type="secondary">Trao đổi trực tiếp với chủ nhà để chuẩn bị cho chuyến đi của bạn.</Text>
      </div>

      <Layout className={styles.messagesLayout}>
        <aside className={styles.conversationList}>
          <div className={styles.listHeader}>
            <Text strong style={{ fontSize: 18 }}>
              Tin nhắn
            </Text>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Badge status={connected ? "success" : "default"} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {connected ? "Đã kết nối" : "Đang kết nối..."}
              </Text>
            </div>
          </div>

          <div className={styles.searchWrap}>
            <Input placeholder="Tìm cuộc trò chuyện..." allowClear />
          </div>

          <div className={styles.tabsRow}>
            <button className={`${styles.tabBtn} ${styles.tabBtnActive}`} type="button">
              Tất cả
            </button>
            <button className={styles.tabBtn} type="button">
              Chưa đọc
            </button>
            <button className={styles.tabBtn} type="button">
              Ưu tiên
            </button>
          </div>

          <div className={styles.conversationScroll}>
            <List
              dataSource={conversations}
              loading={loadingConversations}
              renderItem={(c) => {
                const host = c.host_id;
                const bookingObj = typeof c.booking_id === "string" ? null : c.booking_id;
                const listingTitle = bookingObj?.listing_id?.title || c.listing_id?.title || "Đặt phòng";
                const lastTime = c.last_message_at || c.last_updated;
                const active = selectedConversation?._id === c._id;

                return (
                  <div
                    key={c._id}
                    className={`${styles.conversationItem} ${active ? styles.conversationItemActive : ""}`}
                    onClick={() => handleSelectConversation(c)}
                  >
                    <div className={styles.avatarWrap}>
                      <Avatar size={52} src={host?.avatar_url} style={{ background: "#e7edf3", color: "#0d141b" }}>
                        {(host?.name || "H").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <span className={styles.onlineDot} />
                    </div>
                    <div className={styles.convInfo}>
                      <div className={styles.convHeader}>
                        <div className={styles.convName}>{`Host: ${host?.name || "Chủ nhà"}`}</div>
                        <div className={styles.convTime}>{formatTimeAgo(lastTime)}</div>
                      </div>
                      <div className={styles.convSub}>{listingTitle}</div>
                      <div className={styles.convLast}>{c.last_message_preview || ""}</div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </aside>

        <section className={styles.chatArea}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div
                className={styles.listingPhoto}
                style={{
                  backgroundImage: getListingPhoto() ? `url("${getListingPhoto()}")` : undefined,
                }}
              />
              <div className={styles.chatHeaderMeta}>
                <div className={styles.listingTitle}>{getListingTitle()}</div>
                <div className={styles.bookingMeta}>
                  <CalendarOutlined />
                  <span>{getDateRange()}</span>
                  <span>•</span>
                  {statusTag()}
                </div>
              </div>
            </div>
            <Button type="default">Xem chi tiết đặt phòng</Button>
          </div>

          <div
            className={styles.messagesScroll}
            ref={messagesContainerRef}
            onScroll={async (e) => {
              const el = e.currentTarget;
              if (el.scrollTop < 40 && !isLoadingMore && hasMore && !loadingMessages) {
                if (!selectedConversation) return;
                const oldest = messages[0];
                if (!oldest) return;
                const before = oldest.sent_at;
                try {
                  setIsLoadingMore(true);
                  const prevScrollHeight = el.scrollHeight;
                  const older = (await getAccess("messages", {
                    conversationId: selectedConversation._id,
                    limit: PAGE_SIZE,
                    before,
                  })) as MessageDto[];
                  const list = Array.isArray(older) ? older : [];
                  if (list.length > 0) {
                    isPrependingRef.current = true;
                    setMessages((prev) => [...list.map((m) => ({ ...m, _localStatus: "sent" })), ...prev]);
                    setHasMore(list.length === PAGE_SIZE);
                    setTimeout(() => {
                      const diff = el.scrollHeight - prevScrollHeight;
                      el.scrollTop = diff;
                    }, 0);
                  } else {
                    setHasMore(false);
                  }
                } catch (err) {
                  console.error("load older messages error", err);
                } finally {
                  setIsLoadingMore(false);
                }
              }
            }}
          >
            <div className={styles.daySeparator}>
              <div className={styles.dayLine} />
              <div className={styles.dayText}>HÔM NAY</div>
              <div className={styles.dayLine} />
            </div>

            {loadingMessages ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Spin />
                <Text>Đang tải...</Text>
              </div>
            ) : (
              <>
                {messages.map((m) => {
                  const outgoing = isOutgoing(m);
                  const hasImages = (m.image_urls || []).length > 0;
                  const rowClass = outgoing ? styles.rowOutgoing : styles.rowIncoming;
                  const bubbleClass = `${styles.bubble} ${
                    outgoing ? styles.bubbleOutgoing : styles.bubbleIncoming
                  } ${m._localStatus === "sending" ? styles.sending : ""}`;
                  const timeText = formatClock(m.sent_at);

                  const showSeen = outgoing && m.is_read && !!otherUser?.avatar_url;

                  return (
                    <div key={m._id} style={{ marginBottom: 14 }}>
                      <div className={rowClass}>
                        {!outgoing && (
                          <Avatar
                            size={36}
                            src={otherUser?.avatar_url}
                            style={{ background: "#e7edf3", color: "#0d141b" }}
                          >
                            {(otherUser?.name || "H").slice(0, 1).toUpperCase()}
                          </Avatar>
                        )}

                        <div className={bubbleClass}>
                          {m.content && <div className={styles.msgText}>{m.content}</div>}

                          {hasImages && (
                            <div className={styles.imgGrid}>
                              {(m.image_urls || []).map((url) => (
                                <div key={url} className={styles.imgItem}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt="attachment"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className={`${styles.metaRow} ${!outgoing ? styles.metaRowIncoming : ""}`}>
                            <span>{timeText}</span>
                            {outgoing && (
                              <span>
                                {m._localStatus === "sending"
                                  ? "Đang gửi..."
                                  : m._localStatus === "error"
                                    ? "Gửi lỗi"
                                    : "Đã gửi"}
                              </span>
                            )}
                          </div>

                          {showSeen && (
                            <Avatar size={18} src={otherUser?.avatar_url} className={styles.seenAvatar} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {typingByOther && (
                  <div className={styles.typingRow}>
                    <Avatar
                      size={22}
                      src={otherUser?.avatar_url}
                      style={{ background: "#e7edf3", color: "#0d141b" }}
                    >
                      {(otherUser?.name || "H").slice(0, 1).toUpperCase()}
                    </Avatar>
                    <span>Host đang nhập</span>
                    <span className={styles.dots}>
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                    </span>
                  </div>
                )}
              </>
            )}

            <div ref={endRef} />
          </div>

          <div className={styles.composer}>
            <div className={styles.composerBox}>
              <Input.TextArea
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 6 }}
                placeholder="Nhập tin nhắn cho host..."
                style={{ border: "none", boxShadow: "none" }}
              />

              {selectedFiles.length > 0 && (
                <div className={styles.previews}>
                  {selectedFiles.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className={styles.previewItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        className={styles.previewRemove}
                        onClick={() => removeFile(idx)}
                        aria-label="Remove"
                      >
                        <CloseOutlined style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.composerTools}>
                <div className={styles.toolLeft}>
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
                  onClick={handleSend}
                  disabled={!selectedConversation || (!draft.trim() && selectedFiles.length === 0)}
                >
                  Gửi
                </Button>
              </div>
            </div>
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Để bảo vệ quyền lợi, hãy luôn trao đổi và thanh toán trực tiếp qua nền tảng StayEase.
              </Text>
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
}

