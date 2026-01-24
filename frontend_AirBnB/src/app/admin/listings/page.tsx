"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Tag, Button, message, Card, Space, Row, Col, Statistic, Modal, Checkbox } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { getAccess, patchAccess, deleteData } from "@/helper/api";
import ListingFilters, { FilterValues } from "@/components/admin/ListingFilters";
import type { ColumnsType } from "antd/es/table";
import type { TableRowSelection } from "antd/es/table/interface";

interface Listing {
  _id: string;
  title: string;
  city: string;
  country: string;
  price_base: number;
  currency: string;
  status: string;
  avg_rating?: number;
  createdAt?: string;
  host_id?: {
    name: string;
    email: string;
  };
}

interface Stats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalRevenue: number;
  totalBookings: number;
}

export default function AllListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterValues>({});

  useEffect(() => {
    fetchListings();
    fetchStats();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const result = await getAccess("admin/listings", {}, true);
      setListings(result.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách listings");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await getAccess("admin/listings/stats/all", {}, true);
      setStats(result);
    } catch (error) {
      console.error("Error fetching stats:", error);
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
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa listing này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteData(`admin/listings/${id}`, true);
          message.success("Xóa listing thành công");
          fetchListings();
        } catch (error) {
          message.error("Có lỗi xảy ra");
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một listing");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa hàng loạt",
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} listing?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setLoading(true);
          for (const id of selectedRowKeys) {
            await deleteData(`admin/listings/${id}`, true);
          }
          message.success(`Đã xóa ${selectedRowKeys.length} listing`);
          setSelectedRowKeys([]);
          fetchListings();
        } catch (error) {
          message.error("Có lỗi xảy ra");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một listing");
      return;
    }

    try {
      setLoading(true);
      await patchAccess(
        "admin/listings/bulk/update",
        {
          ids: selectedRowKeys,
          updateData: { status },
        },
        true
      );
      message.success(`Đã cập nhật trạng thái cho ${selectedRowKeys.length} listing`);
      setSelectedRowKeys([]);
      fetchListings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Tiêu đề", "Thành phố", "Quốc gia", "Giá", "Host", "Trạng thái", "Đánh giá", "Ngày tạo"];
    const rows = filteredListings.map((listing) => [
      listing.title,
      listing.city,
      listing.country,
      `${listing.price_base} ${listing.currency}`,
      listing.host_id?.name || "N/A",
      listing.status,
      listing.avg_rating || "N/A",
      listing.createdAt ? new Date(listing.createdAt).toLocaleDateString("vi-VN") : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `listings-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    message.success("Đã tải xuống danh sách listings");
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !filters.searchText ||
      listing.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      listing.city.toLowerCase().includes(filters.searchText.toLowerCase());

    const matchesStatus =
      !filters.status || filters.status === "all" || listing.status === filters.status;

    const matchesCity = !filters.city || listing.city === filters.city;

    const matchesPrice =
      !filters.priceRange ||
      (listing.price_base >= filters.priceRange[0] && listing.price_base <= filters.priceRange[1]);

    const matchesRating =
      !filters.ratingRange ||
      !listing.avg_rating ||
      (listing.avg_rating >= filters.ratingRange[0] && listing.avg_rating <= filters.ratingRange[1]);

    const matchesDate =
      !filters.dateRange ||
      !listing.createdAt ||
      (new Date(listing.createdAt) >= filters.dateRange[0].toDate() &&
        new Date(listing.createdAt) <= filters.dateRange[1].toDate());

    return matchesSearch && matchesStatus && matchesCity && matchesPrice && matchesRating && matchesDate;
  });

  const columns: ColumnsType<Listing> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Thành phố",
      dataIndex: "city",
      key: "city",
      width: 120,
    },
    {
      title: "Quốc gia",
      dataIndex: "country",
      key: "country",
      width: 100,
    },
    {
      title: "Giá",
      key: "price",
      width: 100,
      render: (_, record) => `${record.price_base} ${record.currency}`,
      sorter: (a, b) => a.price_base - b.price_base,
    },
    {
      title: "Đánh giá",
      key: "rating",
      width: 100,
      render: (_, record) => {
        const rating = record.avg_rating || 0;
        return rating > 0 ? `${rating.toFixed(1)} ⭐` : "N/A";
      },
      sorter: (a, b) => (a.avg_rating || 0) - (b.avg_rating || 0),
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
      width: 100,
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Đã duyệt" : "Chờ duyệt"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"),
      sorter: (a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/listings/${record._id}`)}
            title="Xem chi tiết"
          />
          <Button
            type="text"
            size="small"
            onClick={() =>
              handleUpdateStatus(
                record._id,
                record.status === "active" ? "inactive" : "active"
              )
            }
            title={record.status === "active" ? "Vô hiệu hóa" : "Duyệt"}
          >
            {record.status === "active" ? "⊘" : "✓"}
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            title="Xóa"
          />
        </Space>
      ),
    },
  ];

  const rowSelection: TableRowSelection<Listing> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as string[]),
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <div>
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng Listings"
                value={stats.totalListings}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đã Duyệt"
                value={stats.activeListings}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Chờ Duyệt"
                value={stats.pendingListings}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Doanh Thu"
                value={`$${stats.totalRevenue.toLocaleString()}`}
                valueStyle={{ color: "#eb2f96" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <ListingFilters
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16, backgroundColor: "#e6f7ff", borderColor: "#1890ff" }}>
          <Space wrap>
            <span>Đã chọn {selectedRowKeys.length} listing</span>
            <Button
              size="small"
              onClick={() => handleBulkStatusUpdate("active")}
            >
              Duyệt tất cả
            </Button>
            <Button
              size="small"
              onClick={() => handleBulkStatusUpdate("inactive")}
            >
              Vô hiệu hóa tất cả
            </Button>
            <Button
              size="small"
              danger
              onClick={handleBulkDelete}
            >
              Xóa tất cả
            </Button>
          </Space>
        </Card>
      )}

      {/* Export & Actions */}
      <Space style={{ marginBottom: 16, display: "block" }}>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
        >
          Xuất CSV
        </Button>
      </Space>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => (record.status === "inactive" ? "pending-listing-row" : "")}
        />
      </Card>
    </div>
  );
}

