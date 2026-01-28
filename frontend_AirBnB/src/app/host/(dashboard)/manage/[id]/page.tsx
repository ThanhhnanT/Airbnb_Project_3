"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, Button, Space, Spin, Empty, Tag, Dropdown, Tooltip, Input, Upload, Modal, Card } from "antd";
import { EditOutlined, DeleteOutlined, ExportOutlined, MoreOutlined, ArrowLeftOutlined, UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { getAccess, patchAccess, getAccess as getApi, postAccess, deleteData, patchAccess as patchApi } from "@/helper/api";
import OverviewTab from "./components/OverviewTab";
import PerformanceTab from "./components/PerformanceTab";
import BookingsTab from "./components/BookingsTab";
import ReviewsTab from "./components/ReviewsTab";
import { Listing, ListingAnalytics } from "./types";
import styles from "./listing-detail.module.css";
import { useMessageApi } from "@/components/providers/Message";

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const messageApi = useMessageApi();

  const [listing, setListing] = useState<Listing | null>(null);
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ imageId: string; urlIndex: number } | null>(null);

  useEffect(() => {
    fetchListing();
    fetchAnalytics();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await getAccess(`listings/${listingId}`);
      setListing(data);
      if (!isEditing) {
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      messageApi?.error("Không thể tải thông tin listing");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await getAccess(`listings/host/${listingId}/analytics`);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Don't show error for analytics, it's optional
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleToggleEdit = () => {
    if (!listing) return;
    
    // Không cho phép chỉnh sửa nếu listing đang ở trạng thái inactive (chờ duyệt)
    if (listing.status === 'inactive') {
      messageApi?.warning("Listing đang ở trạng thái chờ duyệt. Vui lòng đợi admin duyệt lại trước khi chỉnh sửa.");
      return;
    }
    
    if (!isEditing) {
      // Enter edit mode with current values
      setEditTitle(listing.title || "");
      setEditDescription(listing.description || "");
      setIsEditing(true);
    } else {
      // Cancel edit, reset values
      setEditTitle(listing.title || "");
      setEditDescription(listing.description || "");
      setIsEditing(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!listing) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      messageApi?.error("Tiêu đề không được để trống");
      return;
    }
    try {
      setSaving(true);
      const payload: Partial<Listing> = {
        title: trimmedTitle,
        description: editDescription,
      };
      const updated = await patchAccess(`listings/${listingId}`, payload);
      
      // Check if status changed to inactive
      const statusChanged = updated.status === 'inactive' && listing.status === 'active';
      
      if (statusChanged) {
        messageApi?.warning("Listing đã được cập nhật và chuyển về trạng thái chờ duyệt. Admin sẽ được thông báo để xem xét lại.");
      } else {
        messageApi?.success("Cập nhật thông tin cơ bản thành công");
      }
      
      // Cập nhật state cục bộ để phản ánh ngay
      setListing((prev) =>
        prev
          ? {
              ...prev,
              title: updated.title ?? trimmedTitle,
              description: updated.description ?? editDescription,
              status: (updated.status as Listing["status"]) ?? prev.status,
            }
          : prev,
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating listing:", error);
      messageApi?.error("Không thể cập nhật thông tin. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    // Implement delete functionality
    messageApi?.info("Chức năng xóa sẽ được cập nhật");
  };

  const handleExport = () => {
    // Implement export functionality
    messageApi?.info("Chức năng export sẽ được cập nhật");
  };

  const refreshImages = async () => {
    try {
      setImagesLoading(true);
      const images = await getApi(`listing-images`, { listingId });
      setListing((prev) =>
        prev
          ? {
              ...prev,
              images,
            }
          : prev,
      );
    } catch (error) {
      console.error("Error fetching listing images:", error);
      messageApi?.error("Không thể tải danh sách hình ảnh");
    } finally {
      setImagesLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });

  const handleUploadImages = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      // Convert file to base64
      const base64Image = await fileToBase64(file as File);
      
      // Upload to Cloudinary
      const uploadResult = await postAccess("upload/image", {
        image: base64Image,
        folder: "airbnb-listings",
      });
      
      // Get the real URL from Cloudinary
      const cloudinaryUrl = uploadResult.url;
      
      // Save to listing-images with the real URL
      await postAccess("listing-images", {
        listing_id: listingId,
        image_url: [cloudinaryUrl],
        is_cover: !listing?.images || listing.images.length === 0,
      });
      
      messageApi?.success("Thêm ảnh thành công");
      await refreshImages();
      onSuccess?.("ok");
    } catch (error) {
      console.error("Error uploading image:", error);
      messageApi?.error("Không thể thêm ảnh");
      onError?.(error);
    }
  };

  const handleSetCover = async (imageId: string) => {
    try {
      if (!listing?.images) return;
      setImagesLoading(true);
      // Bỏ cover cũ
      const currentCover = listing.images.find((img) => img.is_cover);
      if (currentCover && currentCover._id && currentCover._id !== imageId) {
        await patchApi(`listing-images/${currentCover._id}`, { is_cover: false });
      }
      // Set cover mới
      await patchApi(`listing-images/${imageId}`, { is_cover: true });
      messageApi?.success("Đã đặt ảnh cover");
      await refreshImages();
    } catch (error) {
      console.error("Error setting cover image:", error);
      messageApi?.error("Không thể đặt ảnh cover");
    } finally {
      setImagesLoading(false);
    }
  };

  const handleDeleteImage = (imageId: string, urlIndex: number) => {
    setDeleteTarget({ imageId, urlIndex });
  };

  const handleConfirmDeleteImage = async () => {
    if (!deleteTarget || !listing?.images) return;
    try {
      setImagesLoading(true);
      const img = listing.images.find((i) => i._id === deleteTarget.imageId);
      if (!img) {
        setDeleteTarget(null);
        setImagesLoading(false);
        return;
      }

      const currentUrls = Array.isArray(img.image_url) ? [...img.image_url] : [];
      if (deleteTarget.urlIndex >= 0 && deleteTarget.urlIndex < currentUrls.length) {
        currentUrls.splice(deleteTarget.urlIndex, 1);
      }

      if (currentUrls.length > 0) {
        await patchApi(`listing-images/${img._id}`, { image_url: currentUrls });
      } else if (img._id) {
        await deleteData(`listing-images/${img._id}`);
      }

      await refreshImages();
      messageApi?.success("Đã xóa ảnh");
    } catch (error) {
      console.error("Error deleting image:", error);
      messageApi?.error("Không thể xóa ảnh");
    } finally {
      setImagesLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleSaveImages = async () => {
    if (totalImages < 5) {
      messageApi?.warning("Listing cần có ít nhất 5 ảnh. Vui lòng thêm đủ 5 ảnh trước khi lưu.");
      return;
    }
    try {
      // Đảm bảo state ảnh được đồng bộ lại từ backend sau các thao tác thêm/xóa
      await refreshImages();
      
      // Nếu listing đang active, gửi thêm một PATCH \"nhẹ\" (giữ nguyên title)
      // Backend sẽ tự động set status về inactive khi có update mà không truyền status
      if (listing && listing.status === 'active') {
        try {
          const updated = await patchAccess(`listings/${listingId}`, {
            title: listing.title,
          });

          if (updated.status === 'inactive') {
            messageApi?.warning("Listing đã được cập nhật và chuyển về trạng thái chờ duyệt. Admin sẽ được thông báo để xem xét lại.");
            setListing((prev) => prev ? { ...prev, status: 'inactive' } : prev);
          }
        } catch (updateError) {
          console.error("Error triggering listing update:", updateError);
          // Không chặn quá trình lưu nếu phần này lỗi
        }
      }
    } finally {
      setImageModalVisible(false);
    }
  };

  const menuItems = [
    {
      key: "view-live",
      label: "Xem Trực Tiếp",
      onClick: () => window.open(`/listings/${listingId}`, "_blank"),
    },
    {
      key: "delete",
      label: "Xóa Listing",
      danger: true,
      onClick: handleDelete,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "600px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!listing) {
    return <Empty description="Listing không tồn tại" />;
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "success" : "warning";
  };

  const totalImages =
    listing.images?.reduce(
      (sum, img) => sum + (img.image_url ? img.image_url.length : 0),
      0,
    ) ?? 0;

  const coverImageUrl =
    listing.images?.find((img) => img.is_cover && img.image_url && img.image_url[0])?.image_url[0] ??
    (listing.images && listing.images.length > 0 && listing.images[0]?.image_url?.[0]
      ? listing.images[0].image_url[0]
      : listing.cover_image || null);

  return (
    <div className={styles.container}>
      {/* Header */}
        <div className={styles.header}>
        <div
          className={styles.coverImage}
          style={{
            backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : "none",
          }}
          title={coverImageUrl ? "Hình ảnh phòng" : "Chưa có hình ảnh"}
        >
          {!coverImageUrl && "Không có hình ảnh"}
        </div>
        <div className={styles.headerInfo}>
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              style={{ marginBottom: 16 }}
            >
              Quay Lại
            </Button>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={120}
                showCount
                className={styles.headerTitle}
              />
            ) : (
              <h1 className={styles.headerTitle}>{listing.title}</h1>
            )}
            <div className={styles.headerAddress}>
              {listing.street && <div>{listing.street}</div>}
              <div>
                {listing.city}, {listing.country}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Tag color={getStatusColor(listing.status)}>
                {listing.status === "active" ? "Đang Hoạt Động" : "Chờ Duyệt"}
              </Tag>
            </div>
          </div>
          <div className={styles.headerActions}>
            {isEditing ? (
              <Space>
                <Button onClick={handleToggleEdit} disabled={saving}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  loading={saving}
                  onClick={handleSaveBasicInfo}
                >
                  Lưu
                </Button>
              </Space>
            ) : (
              <Tooltip title={listing.status === 'inactive' ? "Listing đang chờ duyệt, không thể chỉnh sửa" : "Chỉnh Sửa tiêu đề và mô tả"}>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={handleToggleEdit}
                  disabled={listing.status === 'inactive'}
                >
                  Chỉnh Sửa
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Xuất">
              <Button icon={<ExportOutlined />} onClick={handleExport} />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Image Management Section */}
      <Card style={{ marginTop: 24, marginBottom: 24 }} title="Hình Ảnh Listing">
        <Space style={{ marginBottom: 16 }}>
          <Button 
            onClick={() => {
              if (listing.status === 'inactive') {
                messageApi?.warning("Listing đang ở trạng thái chờ duyệt. Vui lòng đợi admin duyệt lại trước khi chỉnh sửa ảnh.");
                return;
              }
              setImageModalVisible(true);
            }}
            disabled={listing.status === 'inactive'}
          >
            Quản lý ảnh
          </Button>
        </Space>
        <div className={styles.imageGridPreview}>
          {listing.images && listing.images.length > 0 ? (
            listing.images.slice(0, 5).map((img) =>
              img.image_url.map((url, idx) => (
                <div key={`${img._id}-${idx}`} className={styles.imageItemPreview}>
                  <img src={url} alt={listing.title} />
                  {img.is_cover && <span className={styles.coverBadge}>Cover</span>}
                </div>
              )),
            )
          ) : (
            <div>Chưa có ảnh cho listing này</div>
          )}
        </div>
      </Card>

      <Modal
        title="Quản lý hình ảnh"
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setImageModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveImages}>
            Lưu thay đổi
          </Button>,
        ]}
      >
        <Space style={{ marginBottom: 16 }}>
          <Upload multiple customRequest={handleUploadImages} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Thêm Ảnh</Button>
          </Upload>
          <Button onClick={refreshImages} loading={imagesLoading}>
            Làm mới ảnh
          </Button>
        </Space>
        {imagesLoading && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Spin />
          </div>
        )}
        {listing.images && listing.images.length > 0 ? (
          <div className={styles.imageGridModal}>
            {listing.images.map((img) =>
              img.image_url.map((url, idx) => (
                <div key={`${img._id}-${idx}`} className={styles.imageItemModal}>
                  <img src={url} alt={listing.title} />
                  <div className={styles.imageActions}>
                    <Button
                      size="small"
                      type={img.is_cover ? "primary" : "default"}
                      onClick={() => img._id && handleSetCover(img._id)}
                    >
                      {img.is_cover ? "Ảnh cover hiện tại" : "Đặt làm cover"}
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => img._id && handleDeleteImage(img._id, idx)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              )),
            )}
          </div>
        ) : (
          <Empty description="Chưa có ảnh" />
        )}
      </Modal>

      <Modal
        title="Xóa ảnh này?"
        open={!!deleteTarget}
        onOk={handleConfirmDeleteImage}
        confirmLoading={imagesLoading}
        onCancel={() => setDeleteTarget(null)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>
          Bạn chắc chắn muốn xóa ảnh này khỏi listing? Listing phải luôn có ít nhất 5 ảnh.
        </p>
      </Modal>

      {/* Tabs */}
      <Tabs
        className={styles.tabsContainer}
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: "Tổng Quan",
            children: (
              <OverviewTab
                listing={listing}
                isEditing={isEditing}
                editDescription={editDescription}
                onDescriptionChange={setEditDescription}
              />
            ),
          },
          {
            key: "performance",
            label: "Hiệu Suất",
            children: analyticsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "500px" }}>
                <Spin size="large" />
              </div>
            ) : (
              <PerformanceTab analytics={analytics} />
            ),
          },
          {
            key: "bookings",
            label: "Booking",
            children: <BookingsTab listingId={listingId} />,
          },
          {
            key: "reviews",
            label: "Đánh Giá",
            children: <ReviewsTab listingId={listingId} />,
          },
        ]}
      />
    </div>
  );
}
