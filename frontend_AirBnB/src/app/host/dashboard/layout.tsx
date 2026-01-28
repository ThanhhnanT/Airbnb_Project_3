import HostLayout from "@/components/host/HostLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HostLayout>{children}</HostLayout>;
}
