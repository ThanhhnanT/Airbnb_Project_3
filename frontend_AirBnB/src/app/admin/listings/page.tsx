"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Tag, Button, message, Card, Space, Input, Select, Badge } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { getAccess, patchAccess, deleteData } from "@/helper/api";
import type { ColumnsType } from "antd/es/table";

interface Listing {
  _id: string;
  title: string;
  city: string;
  country: string;
  price_base: number;
  currency: string;
  status: string;
  createdAt?: string;
  host_id?: {
    name: string;
    email: string;
  };
}

export default function AllListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const result = await getAccess("admin/listings", {}, true); // Use admin token
      setListings(result.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách listings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await patchAccess(`admin/listings/${id}/status`, { status });
      message.success("Cập nhật trạng thái thành công");
      fetchListings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteData(`admin/listings/${id}`, true); // Use admin token
      message.success("Xóa listing thành công");
      fetchListings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchText.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = listings.filter((l) => l.status === "inactive").length;

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
        <Tag color={status === "active" ? "green" : "red"}>{status === "active" ? "Đã duyệt" : "Chờ duyệt"}</Tag>
      ),
      filters: [
        { text: "Tất cả", value: "all" },
        { text: "Đã duyệt", value: "active" },
        { text: "Chờ duyệt", value: "inactive" },
      ],
      onFilter: (value, record) => {
        if (value === "all") return true;
        return record.status === value;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"),
      sorter: (a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/listings/${record._id}`)}
          >
            Xem chi tiết
          </Button>
          <Button
            size="small"
            onClick={() =>
              handleUpdateStatus(
                record._id,
                record.status === "active" ? "inactive" : "active"
              )
            }
          >
            {record.status === "active" ? "Vô hiệu hóa" : "Duyệt"}
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
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }} wrap>
          <Space wrap>
            <Input
              placeholder="Tìm kiếm theo tiêu đề hoặc thành phố..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 400 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              placeholder="Lọc theo trạng thái"
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="active">Đã duyệt</Select.Option>
              <Select.Option value="inactive">Chờ duyệt</Select.Option>
            </Select>
          </Space>
          {pendingCount > 0 && (
            <Badge count={pendingCount} showZero>
              <Tag color="orange" style={{ padding: "4px 12px", fontSize: 14 }}>
                Có {pendingCount} listing chờ duyệt
              </Tag>
            </Badge>
          )}
        </Space>
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: "calc(100vh - 300px)" }}
          rowClassName={(record) => (record.status === "inactive" ? "pending-listing-row" : "")}
        />
      </Card>
    </div>
  );
}

