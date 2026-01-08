"use client";

import { useAuth } from "@/lib/auth";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Folder, CheckCircle, BarChart3, LogOut, Loader2, ArrowRight, Moon, Sun, Zap, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Theme Toggle
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading, account, login, logout } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Loading Nexus...</p>
        </div>
      </main>
    );
  }

  // Authenticated - Dashboard
  if (isAuthenticated && account) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <nav className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-semibold">Nexus Project Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="h-8 w-px bg-border mx-2" />
              <div className="text-right mr-3">
                <p className="font-medium text-sm">{account.name}</p>
                <p className="text-muted-foreground text-xs">{account.username}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </nav>

          {/* Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">
              Xin chào, {account.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-muted-foreground">Chào mừng bạn đến với Nexus Project Hub</p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <Link href="/board" className="group">
              <Card className="h-full hover-lift border-border hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    Projects
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardTitle>
                  <CardDescription>
                    Xem và quản lý dự án của bạn
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/board" className="group">
              <Card className="h-full hover-lift border-border hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    My Tasks
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardTitle>
                  <CardDescription>
                    Công việc được giao cho bạn
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Card className="h-full border-border opacity-60">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  Team
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Soon</span>
                </CardTitle>
                <CardDescription>
                  Quản lý thành viên nhóm
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full border-border opacity-60">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  Analytics
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Soon</span>
                </CardTitle>
                <CardDescription>
                  Theo dõi tiến độ dự án
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Getting Started */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Bắt đầu nhanh</CardTitle>
              <CardDescription>Các bước để sử dụng Nexus hiệu quả</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Tạo dự án mới</h3>
                    <p className="text-sm text-muted-foreground">Vào Board và tạo dự án đầu tiên của bạn</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Thêm công việc</h3>
                    <p className="text-sm text-muted-foreground">Tạo task và kéo thả giữa các cột trạng thái</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Theo dõi tiến độ</h3>
                    <p className="text-sm text-muted-foreground">Cập nhật trạng thái và hoàn thành công việc</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not authenticated - Landing Page
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-soft">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="text-xl font-semibold">Nexus Project Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={login} className="ml-2">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-4 h-4" />
          Powered by Microsoft 365
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Quản lý dự án
          <span className="text-gradient-brand"> thông minh</span>
          <br />cho doanh nghiệp
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Tích hợp hoàn hảo với Microsoft Teams, Outlook và SharePoint.
          Quản lý dự án, phân công công việc và theo dõi tiến độ một cách hiệu quả.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={login} className="h-12 px-8 text-base">
            Đăng nhập với Microsoft
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Tính năng nổi bật</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nexus Project Hub cung cấp đầy đủ công cụ để quản lý dự án hiệu quả
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Smart Board</CardTitle>
              <CardDescription>
                Kanban board với drag-drop, theo dõi tiến độ trực quan và phân loại công việc thông minh
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle>Teams Integration</CardTitle>
              <CardDescription>
                Tích hợp Microsoft Teams để cộng tác, tạo cuộc họp và nhận thông báo trực tiếp
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Bảo mật cấp doanh nghiệp với Azure AD, phân quyền chi tiết và audit log
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 PACE Institute of Management. Nexus Project Hub.</p>
        </div>
      </footer>
    </main>
  );
}
