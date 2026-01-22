"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, message, Card, Space, Input } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { getAccess, patch, deleteData } from "@/helper/api";
import type { ColumnsType } from "antd/es/table";

interface Listing {
  _id: string;
  title: string;
  city: string;
  country: string;
  price_base: number;
  currency: string;
  status: string;
  host_id?: {
    name: string;
    email: string;
  };
}

export default function AllListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const result = await getAccess("admin/listings");
      setListings(result.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách listings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await patch(`admin/listings/${id}/status`, { status });
      message.success("Cập nhật trạng thái thành công");
      fetchListings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteData(`admin/listings/${id}`);
      message.success("Xóa listing thành công");
      fetchListings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const filteredListings = listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchText.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Listing> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Thành phố",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Quốc gia",
      dataIndex: "country",
      key: "country",
    },
    {
      title: "Giá",
      key: "price",
      render: (_, record) => `${record.price_base} ${record.currency}`,
    },
    {
      title: "Host",
      key: "host",
      render: (_, record) => {
        if (!record.host_id) return "N/A";
        return (
          <div>
            <div>{record.host_id.name || "N/A"}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>
              {record.host_id.email || ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() =>
              handleUpdateStatus(
                record._id,
                record.status === "active" ? "inactive" : "active"
              )
            }
          >
            {record.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card 
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
          <Input
            placeholder="Tìm kiếm theo tiêu đề hoặc thành phố..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </Space>
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: "calc(100vh - 300px)" }}
        />
      </Card>
    </div>
  );
}

