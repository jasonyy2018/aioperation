import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "自媒体AI运营平台 - AI LiveOps OS",
  description: "生产级多引擎自媒体AI创作与直播网创一体化实战工作台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark h-full w-full" suppressHydrationWarning>
      <body
        className="antialiased bg-slate-950 text-slate-100 h-full w-full overflow-hidden"
        suppressHydrationWarning
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
