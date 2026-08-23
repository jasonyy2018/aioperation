import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: "自媒体AI运营平台 - AI LiveOps OS",
  description: "生产级多引擎自媒体AI创作与直播网创一体化实战工作台",
  keywords: ["AI", "自媒体", "直播", "运营", "内容创作", "老字号"],
  authors: [{ name: "黄浦创业实训基地" }],
  robots: "noindex, nofollow",
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
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
