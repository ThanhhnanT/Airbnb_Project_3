"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Image,
  Modal,
  message,
  Spin,
  Typography,
  Divider,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  App,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { getAccess, patchAccess, deleteData } from "@/helper/api";
import ListingAnalytics from "@/components/admin/ListingAnalytics";
import ListingMapComponent from "@/components/admin/ListingMap";

const { Title, Text } = Typography;

interface ListingImage {
  _id: string;
  image_url: string[];
  is_cover: boolean;
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  street?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  price_base: number;
  currency: string;
  cleaning_fee?: number;
  extra_guest_fee?: number;
  guests: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: string[];
  house_rules?: string;
  cancellation_policy: string;
  status: string;
  createdAt: string;
  host_id?: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

function AdminListingDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { message } = App.useApp();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchListingDetails();
  }, [listingId]);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      const result = await getAccess(`admin/listings/${listingId}`, {}, true);
      console.log("Listing details response:", result);
      
      setListing(result.listing);
      setImages(result.images || []);
      
      // Initialize form with listing data
      if (result.listing && form) {
        try {
          form.setFieldsValue({
            title: result.listing.title,
            description: result.listing.description,
            price_base: result.listing.price_base,
            cleaning_fee: result.listing.cleaning_fee,
            extra_guest_fee: result.listing.extra_guest_fee,
            guests: result.listing.guests,
            bedrooms: result.listing.bedrooms,
            beds: result.listing.beds,
            bathrooms: result.listing.bathrooms,
            cancellation_policy: result.listing.cancellation_policy,
          });
        } catch (formError) {
          console.warn("Warning setting form values:", formError);
        }
      }
    } catch (error) {
      console.error("Error fetching listing details:", error);
      message.error("Không thể tải thông tin listing");
      router.push("/admin/listings");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const result = await getAccess(`admin/listings/${listingId}/analytics`, {}, true);
      setAnalyticsData(result);
    } catch (error) {
      message.error("Không thể tải thống kê");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await patchAccess(`admin/listings/${listingId}`, values, true);
      message.success("Cập nhật listing thành công");
      setEditMode(false);
      fetchListingDetails();
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await patchAccess(`admin/listings/${listingId}/status`, { status: "active" }, true); // Use admin token
      message.success("Listing đã được duyệt thành công!");
      setApproveModalVisible(false);
      fetchListingDetails();
    } catch (error) {
      message.error("Có lỗi xảy ra khi duyệt listing");
    }
  };

  const handleReject = async () => {
    try {
      // Keep status as inactive or delete
      await patchAccess(`admin/listings/${listingId}/status`, { status: "inactive" }, true); // Use admin token
      message.success("Listing đã bị từ chối");
      setRejectModalVisible(false);
      fetchListingDetails();
    } catch (error) {
      message.error("Có lỗi xảy ra khi từ chối listing");
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa listing này?",
      onOk: async () => {
        try {
          await deleteData(`admin/listings/${listingId}`, true); // Use admin token
          message.success("Xóa listing thành công");
          router.push("/admin/listings");
        } catch (error) {
          message.error("Có lỗi xảy ra khi xóa listing");
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!listing) {
    return <div>Listing không tồn tại</div>;
  }

  const allImages = images.flatMap((img) => img.image_url || []);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div style={{ padding: "24px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/admin/listings")}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Title level={2}>{listing.title}</Title>
          <Space>
            <Tag color={listing.status === "active" ? "green" : "red"} style={{ fontSize: 14, padding: "4px 12px" }}>
              {listing.status === "active" ? "Đã duyệt" : "Chờ duyệt"}
            </Tag>
            {listing.status === "inactive" && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => setApproveModalVisible(true)}
                  size="large"
                >
                  Duyệt
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  size="large"
                >
                  Từ chối
                </Button>
              </>
            )}
            {!editMode && (
              <Button icon={<EditOutlined />} onClick={() => setEditMode(true)}>
                Chỉnh sửa
              </Button>
            )}
            {editMode && (
              <>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveEdit}
                  loading={loading}
                >
                  Lưu
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={() => {
                    setEditMode(false);
                    fetchListingDetails();
                  }}
                >
                  Hủy
                </Button>
              </>
            )}
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Xóa
            </Button>
          </Space>
        </div>

        <Divider />

        {/* Tabbed Interface */}
        <Tabs
          items={[
            {
              key: "overview",
              label: "Tổng Quan",
              children: (
                <>
                  {/* Basic Info */}
                  <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="Tiêu đề">{listing.title}</Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        <Tag color={listing.status === "active" ? "green" : "red"}>{listing.status}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Mô tả" span={2}>
                        {listing.description || "Không có mô tả"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Host">
                        {listing.host_id ? (
                          <div>
                            <div>{listing.host_id.name}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {listing.host_id.email}
                            </Text>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">
                        {new Date(listing.createdAt).toLocaleDateString("vi-VN")}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Location */}
                  <Card title="Địa điểm" style={{ marginBottom: 16 }}>
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="Địa chỉ">{listing.street || "N/A"}</Descriptions.Item>
                      <Descriptions.Item label="Thành phố">{listing.city}</Descriptions.Item>
                      <Descriptions.Item label="Quốc gia">{listing.country}</Descriptions.Item>
                      <Descriptions.Item label="Mã bưu điện">{listing.postal_code || "N/A"}</Descriptions.Item>
                      {listing.latitude && listing.longitude && (
                        <Descriptions.Item label="Tọa độ" span={2}>
                          {listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    <div style={{ marginTop: 16 }}>
                      <ListingMapComponent latitude={listing.latitude} longitude={listing.longitude} />
                    </div>
                  </Card>

                  {/* Property Details */}
                  <Card title="Chi tiết property" style={{ marginBottom: 16 }}>
                    <Descriptions column={3} bordered>
                      <Descriptions.Item label="Số khách tối đa">{listing.guests}</Descriptions.Item>
                      <Descriptions.Item label="Phòng ngủ">{listing.bedrooms || "N/A"}</Descriptions.Item>
                      <Descriptions.Item label="Giường">{listing.beds || "N/A"}</Descriptions.Item>
                      <Descriptions.Item label="Phòng tắm">{listing.bathrooms || "N/A"}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Pricing */}
                  <Card title="Giá cả" style={{ marginBottom: 16 }}>
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="Giá mỗi đêm">
                        {listing.price_base} {listing.currency}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phí dọn dẹp">
                        {listing.cleaning_fee || 0} {listing.currency}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phí khách thêm">
                        {listing.extra_guest_fee || 0} {listing.currency}
                      </Descriptions.Item>
                      <Descriptions.Item label="Chính sách hủy">
                        <Tag>{listing.cancellation_policy}</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Amenities */}
                  {listing.amenities && listing.amenities.length > 0 && (
                    <Card title="Tiện nghi" style={{ marginBottom: 16 }}>
                      <Space wrap>
                        {listing.amenities.map((amenity, index) => (
                          <Tag key={index} color="blue">
                            {amenity}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  )}

                  {/* House Rules */}
                  {listing.house_rules && (
                    <Card title="Nội quy nhà" style={{ marginBottom: 16 }}>
                      <Text>{listing.house_rules}</Text>
                    </Card>
                  )}

                  {/* Images Gallery */}
                  <Card title={`Ảnh (${allImages.length} ảnh)`} style={{ marginBottom: 16 }}>
                    {allImages.length > 0 ? (
                      <div>
                        <Image.PreviewGroup>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                              gap: 16,
                            }}
                          >
                            {allImages.map((url, index) => (
                              <Image
                                key={index}
                                src={url}
                                alt={`Image ${index + 1}`}
                                style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: 8 }}
                                preview
                              />
                            ))}
                          </div>
                        </Image.PreviewGroup>
                        {allImages.length < 5 && (
                          <div style={{ marginTop: 16, padding: 12, textAlign: "center", background: "#fff3cd", borderRadius: 8 }}>
                            <Text type="warning">
                              ⚠️ Listing này chỉ có {allImages.length} ảnh. Yêu cầu tối thiểu 5 ảnh.
                            </Text>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: 24, textAlign: "center", background: "#f0f0f0", borderRadius: 8 }}>
                        <Text type="secondary">
                          Listing này không có ảnh nào
                        </Text>
                      </div>
                    )}
                  </Card>
                </>
              ),
            },
            {
              key: "edit",
              label: "Chỉnh Sửa",
              children: editMode ? (
                <Card>
                  <Form form={form} layout="vertical">
                    <Form.Item
                      label="Tiêu đề"
                      name="title"
                      rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      label="Mô tả"
                      name="description"
                    >
                      <Input.TextArea rows={4} />
                    </Form.Item>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Form.Item
                        label="Giá mỗi đêm (USD)"
                        name="price_base"
                        rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                      >
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item
                        label="Phí dọn dẹp (USD)"
                        name="cleaning_fee"
                      >
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item
                        label="Phí khách thêm (USD)"
                        name="extra_guest_fee"
                      >
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item
                        label="Số khách tối đa"
                        name="guests"
                        rules={[{ required: true }]}
                      >
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item
                        label="Phòng ngủ"
                        name="bedrooms"
                      >
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item
                        label="Giường"
                        name="beds"
                      >
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item
                        label="Phòng tắm"
                        name="bathrooms"
                      >
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item
                        label="Chính sách hủy"
                        name="cancellation_policy"
                      >
                        <Select
                          options={[
                            { label: "Linh hoạt", value: "flexible" },
                            { label: "Trung bình", value: "moderate" },
                            { label: "Nghiêm ngặt", value: "strict" },
                          ]}
                        />
                      </Form.Item>
                    </div>
                  </Form>
                </Card>
              ) : (
                <Card>
                  <p>Nhấp "Chỉnh sửa" để bắt đầu chỉnh sửa thông tin listing.</p>
                </Card>
              ),
            },
            {
              key: "analytics",
              label: "Thống Kê",
              children: (
                <ListingAnalytics 
                  data={analyticsData} 
                  loading={analyticsLoading}
                />
              ),
            },
            {
              key: "availability",
              label: "Tính Khả Dụng",
              children: (
                <Card>
                  <Button onClick={() => router.push(`/admin/listings/${listingId}/availability`)}>
                    Quản lý lịch
                  </Button>
                </Card>
              ),
            },
          ]}
          onChange={(key) => {
            if (key === "analytics" && !analyticsData) {
              fetchAnalytics();
            }
          }}
        />
      </Card>

      {/* Approve Modal */}
      <Modal
        title="Xác nhận duyệt listing"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        okText="Duyệt"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn duyệt listing này? Listing sẽ được hiển thị cho tất cả users sau khi duyệt.</p>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Xác nhận từ chối listing"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn từ chối listing này? Listing sẽ không được hiển thị cho users.</p>
      </Modal>
    </div>
  );
}

export default function AdminListingDetailPage() {
  return (
    <App>
      <AdminListingDetailPageContent />
    </App>
  );
}
