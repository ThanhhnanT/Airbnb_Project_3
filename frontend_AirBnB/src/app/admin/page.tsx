"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  message,
  Spin,
  Progress,
  Typography,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  BookOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { getAccess, patch } from "@/helper/api";
import styles from "./admin.module.css";

const { Text } = Typography;

type ListingStatus = "active" | "inactive" | string;

type Listing = {
  _id: string;
  title: string;
  city?: string;
  status: ListingStatus;
};

type Booking = {
  _id: string;
  listing_id?: { title?: string };
  guest_id?: { name?: string };
  check_in?: string;
  check_out?: string;
  status: string;
};

type DashboardStats = {
  totalUsers?: number;
  totalListings?: number;
  totalBookings?: number;
  totalRevenue?: number;
};

type DashboardResponse = {
  stats?: DashboardStats;
};

const Sparkline = ({
  data,
  color,
}: {
  data: number[];
  color: string;
}) => {
  if (!data.length) {
    return <div className={styles.sparklinePlaceholder} />;
  }
  const maxValue = Math.max(...data);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 100 - (value / (maxValue || 1)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={styles.sparkline} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchListings();
    fetchBookings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = (await getAccess("admin/dashboard")) as DashboardResponse | undefined;
      if (result) {
        setDashboardData(result);
      }
    } catch {
      message.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      const result = (await getAccess("admin/listings?limit=10")) as
        | { data?: Listing[] }
        | undefined;
      setListings(result?.data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const result = (await getAccess("admin/bookings?limit=10")) as
        | { data?: Booking[] }
        | undefined;
      setBookings(result?.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const handleUpdateListingStatus = async (id: string, status: ListingStatus) => {
    try {
      await patch(`admin/listings/${id}/status`, { status });
      message.success("Cập nhật trạng thái thành công");
      fetchListings();
    } catch {
      message.error("Có lỗi xảy ra");
    }
  };

  const listingColumns = [
    { title: "Tiêu đề", dataIndex: "title", key: "title" },
    { title: "Thành phố", dataIndex: "city", key: "city" },
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
      render: (_: unknown, record: Listing) => (
        <Button
          size="small"
          onClick={() =>
            handleUpdateListingStatus(
              record._id,
              record.status === "active" ? "inactive" : "active"
            )
          }
        >
          {record.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
        </Button>
      ),
    },
  ];

  const bookingColumns = [
    { title: "Listing", dataIndex: ["listing_id", "title"], key: "listing" },
    { title: "Khách", dataIndex: ["guest_id", "name"], key: "guest" },
    { title: "Check-in", dataIndex: "check_in", key: "check_in" },
    { title: "Check-out", dataIndex: "check_out", key: "check_out" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: "orange",
          confirmed: "green",
          cancelled: "red",
          completed: "blue",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
  ];

  const stats: DashboardStats = dashboardData?.stats || {};
  const visitorTrend = useMemo(() => [80, 120, 150, 180, 170, 160, 175], []);
  const lastWeekTrend = useMemo(() => [60, 70, 90, 100, 95, 90, 110], []);
  const salesTrend = useMemo(() => [1200, 1800, 2400, 2100, 2200, 2600, 2800], []);
  const salesMax = useMemo(() => Math.max(...salesTrend, 1), [salesTrend]);

  const overviewMetrics = [
    {
      title: "Conversion Rate",
      value: "12%",
      trend: "+12%",
      trendColor: "green",
    },
    {
      title: "Sales Rate",
      value: "0.8%",
      trend: "+0.8%",
      trendColor: "green",
    },
    {
      title: "Pending Issues",
      value: "3",
      trend: "-5%",
      trendColor: "red",
    },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <Row gutter={24} className={styles.statsRow}>
        <Col xs={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Tổng người dùng"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Tổng listings"
              value={stats.totalListings || 0}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Tổng bookings"
              value={stats.totalBookings || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue || 0}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24} className={styles.overviewRow}>
        <Col xs={24} lg={16}>
          <Card
            title="Online Store Visitors"
            extra={<Text className={styles.positiveChange}>+12.5% Since last week</Text>}
          >
            <div className={styles.chartHeader}>
              <div>
                <Text className={styles.chartValue}>820</Text>
                <Text type="secondary">Visitors Over Time</Text>
              </div>
            </div>
            <div className={styles.sparklineWrapper}>
              <Sparkline data={visitorTrend} color="#1890ff" />
              <Sparkline data={lastWeekTrend} color="#cfd8e3" />
            </div>
            <div className={styles.legend}>
              <span>
                <span className={styles.legendDotPrimary} />
                Tuần này
              </span>
              <span>
                <span className={styles.legendDotMuted} />
                Tuần trước
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="Sales"
            extra={<Text className={styles.positiveChange}>+33.1% Since last month</Text>}
          >
            <div className={styles.chartHeader}>
              <div>
                <Text className={styles.chartValue}>$18,230</Text>
                <Text type="secondary">Sales Over Time</Text>
              </div>
            </div>
            <div className={styles.barChart}>
              {salesTrend.map((value, index) => (
                <div
                  key={index}
                  className={styles.bar}
                  style={{ height: `${(value / salesMax) * 100}%` }}
                >
                  <span>{["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}</span>
                </div>
              ))}
            </div>
            <div className={styles.legend}>
              <span>
                <span className={styles.legendBarPrimary} />
                Năm nay
              </span>
              <span>
                <span className={styles.legendBarMuted} />
                Năm trước
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} className={styles.overviewRow}>
        <Col xs={24} lg={12}>
          <Card title="Listings gần đây" className={styles.tableCard}>
            <Table
              dataSource={listings}
              columns={listingColumns}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Bookings gần đây" className={styles.tableCard}>
            <Table
              dataSource={bookings}
              columns={bookingColumns}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24} className={styles.overviewRow}>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ hệ thống">
            <Row gutter={16}>
              <Col span={12}>
                <div className={styles.progressCard}>
                  <Text strong>Phê duyệt listing</Text>
                  <Progress percent={72} strokeColor="#1890ff" size="small" />
                  <Text type="secondary" className={styles.trendPositive}>
                    <RiseOutlined /> +5% tuần trước
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.progressCard}>
                  <Text strong>Hoàn tất booking</Text>
                  <Progress percent={64} strokeColor="#52c41a" size="small" />
                  <Text type="secondary" className={styles.trendNegative}>
                    <FallOutlined /> -2% tuần trước
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Online Store Overview">
            <div className={styles.overviewList}>
              {overviewMetrics.map((metric) => (
                <div key={metric.title} className={styles.overviewItem}>
                  <div>
                    <Text strong>{metric.title}</Text>
                    <Text className={styles.overviewValue}>{metric.value}</Text>
                  </div>
                  <Tag color={metric.trendColor}>{metric.trend}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

