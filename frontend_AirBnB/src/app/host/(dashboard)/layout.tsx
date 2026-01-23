"use client";

import HostLayout from "@/components/host/HostLayout";

export default function HostDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HostLayout>{children}</HostLayout>;
}

