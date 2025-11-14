import type { Metadata } from "next";
import AntdProvider from "@/components/providers/AntProvider";


export const metadata: Metadata = {
  title: "Airbnb Clone",
  description: "Airbnb UI using Ant Design",
  icons: {
    icon: "/Logo.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        
        <AntdProvider >{children}</AntdProvider>
      </body>
    </html>
  );
}
