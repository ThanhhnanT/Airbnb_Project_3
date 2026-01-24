import type { Metadata } from "next";
import AntdProvider from "@/components/providers/AntProvider";
import GoogleMapsProvider from "@/components/providers/GoogleMapsProvider";
import "@/styles/globals.css";


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
        <GoogleMapsProvider>
          <AntdProvider>{children}</AntdProvider>
        </GoogleMapsProvider>
      </body>
    </html>
  );
}
