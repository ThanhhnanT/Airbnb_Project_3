"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  message,
  Card,
  Space,
  Switch,
  Modal,
  Row,
  Col,
  Statistic,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { getAccess, patch } from "@/helper/api";
import UserFilters from "@/components/admin/users/UserFilters";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: {
    type: string;
  };
  isActive: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  id_verified?: boolean;
  stripe_account_status?: string;
}

interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [role, setRole] = useState("");
  const [emailVerified, setEmailVerified] = useState("");
  const [phoneVerified, setPhoneVerified] = useState("");
  const [idVerified, setIdVerified] = useState("");
  const [stripeStatus, setStripeStatus] = useState("");
  const [isActive, setIsActive] = useState("");

  // Table params
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  // Apply URL filter on mount
  useEffect(() => {
    if (filterParam) {
      switch (filterParam) {
        case "guest":
          setRole("guest");
          break;
        case "host":
          setRole("host");
          break;
        case "admin":
          setRole("admin");
          break;
        case "pending":
          setEmailVerified("false");
          break;
      }
    }
  }, [filterParam]);

  // Fetch users whenever filters change
  useEffect(() => {
    fetchUsers();
  }, [searchText, role, emailVerified, phoneVerified, idVerified, stripeStatus, isActive]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};

      if (searchText) params.search = searchText;
      if (role) params.role = role;
      // Send string values "true"/"false", backend will handle conversion
      if (emailVerified) params.email_verified = emailVerified;
      if (phoneVerified) params.phone_verified = phoneVerified;
      if (idVerified) params.id_verified = idVerified;
      if (stripeStatus) params.stripe_status = stripeStatus;
      if (isActive) params.isActive = isActive;

      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `admin/users?${queryString}` : "admin/users";

      console.log("Fetching URL:", url);
      const result = await getAccess(url, {}, true);
      setUsers(result.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Không thể tải danh sách users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await patch(`admin/users/${id}`, { isActive: !isActive });
      message.success("Cập nhật trạng thái thành công");
      fetchUsers();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleBulkToggleActive = async (active: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.info("Vui lòng chọn ít nhất một user");
      return;
    }

    Modal.confirm({
      title: `${active ? "Kích hoạt" : "Vô hiệu hóa"} ${selectedRowKeys.length} user?`,
      okText: "Có",
      cancelText: "Không",
      onOk: async () => {
        try {
          for (const id of selectedRowKeys) {
            await patch(`admin/users/${id}`, { isActive: active });
          }
          message.success("Cập nhật thành công");
          setSelectedRowKeys([]);
          fetchUsers();
        } catch (error) {
          message.error("Có lỗi xảy ra");
        }
      },
    });
  };

  const handleViewDetail = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleReset = () => {
    setSearchText("");
    setRole("");
    setEmailVerified("");
    setPhoneVerified("");
    setIdVerified("");
    setStripeStatus("");
    setIsActive("");
    setSelectedRowKeys([]);
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  // Calculate chart data
  const roleChartData = useMemo(() => {
    const roleCount = new Map<string, number>();
    users.forEach((user) => {
      const role = user.role?.type || "guest";
      roleCount.set(role, (roleCount.get(role) || 0) + 1);
    });

    return Array.from(roleCount, ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [users]);

  const statusChartData = useMemo(() => {
    const activeCount = users.filter((u) => u.isActive).length;
    const inactiveCount = users.length - activeCount;

    return [
      { name: "Hoạt động", value: activeCount },
      { name: "Không hoạt động", value: inactiveCount },
    ];
  }, [users]);

  const columns: ColumnsType<User> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handleViewDetail(record._id)}
          style={{ padding: 0, textAlign: "left" }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "N/A",
    },
    {
      title: "Vai trò",
      key: "role",
      render: (_, record) => {
        const colors: { [key: string]: string } = {
          admin: "red",
          host: "blue",
          guest: "cyan",
        };
        return (
          <Tag color={colors[record.role?.type || "guest"]}>
            {(record.role?.type || "guest").toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: "Guest", value: "guest" },
        { text: "Host", value: "host" },
        { text: "Admin", value: "admin" },
      ],
    },
    {
      title: "Email verified",
      key: "email_verified",
      render: (_, record) =>
        record.email_verified ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
        ),
    },
    {
      title: "Phone verified",
      key: "phone_verified",
      render: (_, record) =>
        record.phone_verified ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
        ),
    },
    {
      title: "ID verified",
      key: "id_verified",
      render: (_, record) =>
        record.id_verified ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
        ),
    },
    {
      title: "Stripe",
      key: "stripe",
      render: (_, record) => {
        if (!record.stripe_account_status) return "N/A";
        const colors: { [key: string]: string } = {
          verified: "green",
          pending: "orange",
          unverified: "red",
        };
        return (
          <Tag color={colors[record.stripe_account_status]}>
            {record.stripe_account_status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "isActive",
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggleActive(record._id, record.isActive)}
        />
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record._id)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    verified: users.filter((u) => u.email_verified).length,
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tổng Users" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Đang hoạt động" value={stats.active} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Email verified" value={stats.verified} />
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card>
        {/* Filters */}
        <UserFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          role={role}
          onRoleChange={setRole}
          emailVerified={emailVerified}
          onEmailVerifiedChange={setEmailVerified}
          phoneVerified={phoneVerified}
          onPhoneVerifiedChange={setPhoneVerified}
          idVerified={idVerified}
          onIdVerifiedChange={setIdVerified}
          stripeStatus={stripeStatus}
          onStripeStatusChange={setStripeStatus}
          isActive={isActive}
          onIsActiveChange={setIsActive}
          onReset={handleReset}
        />

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <Space style={{ marginBottom: 16 }}>
            <span>Đã chọn {selectedRowKeys.length} user</span>
            <Button onClick={() => handleBulkToggleActive(true)} type="primary">
              Kích hoạt
            </Button>
            <Button onClick={() => handleBulkToggleActive(false)} danger>
              Vô hiệu hóa
            </Button>
            <Button onClick={() => setSelectedRowKeys([])}>Bỏ chọn</Button>
          </Space>
        )}

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Phân Bố Vai Trò">
            {roleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phân Bố Trạng Thái Hoạt Động">
            {statusChartData.length > 0 && (statusChartData[0].value > 0 || statusChartData[1].value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#52c41a" : "#ff4d4f"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

