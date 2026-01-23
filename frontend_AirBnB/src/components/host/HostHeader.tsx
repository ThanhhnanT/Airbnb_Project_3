"use client";

import { Button, Badge, Input } from "antd";
import {
  PlusCircleOutlined,
  BellOutlined,
  SettingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import styles from "@/app/host/(dashboard)/manage/host-manage.module.css";

interface HostHeaderProps {
  showSearch?: boolean;
}

export default function HostHeader({ showSearch = true }: HostHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Ở bước này, search chỉ là UI chung; từng trang (như manage) có filter riêng.
  const isManagePage = pathname?.startsWith("/host/manage");

  return (
    <div className={styles.headerInner}>
      <div className={styles.headerLeft}>
        {showSearch && isManagePage && (
          <Input
            placeholder="Tìm kiếm chỗ ở..."
            prefix={<SearchOutlined />}
            className={styles.searchInput}
          />
        )}
      </div>
      <div className={styles.headerRight}>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={() => router.push("/host/create")}
        >
          Tạo chỗ ở mới
        </Button>
        <div className={styles.headerDivider} />
        <Badge count={3} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            className={styles.iconButton}
          />
        </Badge>
        <Button
          type="text"
          icon={<SettingOutlined />}
          className={styles.iconButton}
        />
      </div>
    </div>
  );
}

