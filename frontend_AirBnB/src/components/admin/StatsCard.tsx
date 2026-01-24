"use client";

import { Card, Statistic, Space } from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

interface StatsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
  suffix?: string;
  prefix?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  suffix,
  prefix,
}) => {
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        prefix={prefix || icon}
        suffix={suffix}
        valueStyle={{ color }}
      />
    </Card>
  );
};

export default StatsCard;
