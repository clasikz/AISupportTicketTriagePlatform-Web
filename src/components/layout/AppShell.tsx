"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDragResize } from "@/hooks/useDragResize";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  const { size: sidebarW, startDrag: startSidebarDrag } = useDragResize(
    "sidebar-width",
    224,
    160,
    360
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#dfe1e6] border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Topbar />
      <Sidebar
        width={sidebarW}
        onStartDrag={(e) => startSidebarDrag(e, "right")}
      />
      <div
        className="pt-12 transition-[margin] duration-75"
        style={{ marginLeft: sidebarW }}
      >
        <main>{children}</main>
      </div>
      <Footer />
    </>
  );
}
