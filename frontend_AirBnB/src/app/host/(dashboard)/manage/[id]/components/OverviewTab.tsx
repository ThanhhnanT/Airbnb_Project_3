"use client";

import { Card, Row, Col, Typography, Tag, Divider, Empty } from "antd";
import { Listing } from "../types";
import styles from "../listing-detail.module.css";

const { Title, Text, Paragraph } = Typography;

interface OverviewTabProps {
  listing: Listing;
}

export default function OverviewTab({ listing }: OverviewTabProps) {
  if (!listing) {
    return <Empty description="Chưa tải thông tin listing" />;
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "success" : "warning";
  };

  return (
    <>
      {/* Cover Image */}
      {listing.cover_image && (
        <Card style={{ marginBottom: 16 }}>
          <img
            src={listing.cover_image}
            alt={listing.title}
            style={{
              width: "100%",
              height: "400px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        </Card>
      )}

      {/* Basic Info */}
      <Card style={{ marginBottom: 16 }} title="Thông Tin Cơ Bản">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>Tiêu Đề</Text>
              <Paragraph>{listing.title}</Paragraph>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>Trạng Thái</Text>
              <Paragraph>
                <Tag color={getStatusColor(listing.status)}>
                  {listing.status === "active" ? "Đang Hoạt Động" : "Chờ Duyệt"}
                </Tag>
              </Paragraph>
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <div>
              <Text strong>Mô Tả</Text>
              <Paragraph>{listing.description}</Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Location */}
      <Card style={{ marginBottom: 16 }} title="Địa Chỉ">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Đường</Text>
            <Paragraph>{listing.street || "N/A"}</Paragraph>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Thành Phố</Text>
            <Paragraph>{listing.city}</Paragraph>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Quốc Gia</Text>
            <Paragraph>{listing.country}</Paragraph>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Mã Bưu Chính</Text>
            <Paragraph>{listing.postal_code || "N/A"}</Paragraph>
          </Col>
        </Row>
      </Card>

      {/* Property Details */}
      <Card style={{ marginBottom: 16 }} title="Chi Tiết Phòng">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>Khách (Tối Đa)</Text>
              <Paragraph>{listing.guests}</Paragraph>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>Phòng Ngủ</Text>
              <Paragraph>{listing.bedrooms}</Paragraph>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>Giường</Text>
              <Paragraph>{listing.beds}</Paragraph>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>Phòng Tắm</Text>
              <Paragraph>{listing.bathrooms}</Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Pricing */}
      <Card style={{ marginBottom: 16 }} title="Giá Cả">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>Giá Cơ Bản / Đêm</Text>
              <Paragraph>
                {listing.currency} {listing.price_base.toFixed(2)}
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>Phí Vệ Sinh</Text>
              <Paragraph>
                {listing.currency} {(listing.cleaning_fee || 0).toFixed(2)}
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>Phí Khách Bổ Sung / Đêm</Text>
              <Paragraph>
                {listing.currency} {(listing.extra_guest_fee || 0).toFixed(2)}
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Amenities */}
      <Card style={{ marginBottom: 16 }} title="Tiện Ích">
        {listing.amenities && listing.amenities.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {listing.amenities.map((amenity, index) => (
              <Tag key={index} color="blue">
                {amenity}
              </Tag>
            ))}
          </div>
        ) : (
          <Text type="secondary">Chưa thêm tiện ích</Text>
        )}
      </Card>

      {/* House Rules */}
      {listing.house_rules && (
        <Card title="Quy Tắc Nhà">
          <Paragraph>{listing.house_rules}</Paragraph>
        </Card>
      )}
    </>
  );
}
