"use client";

import { useAuth } from "@/lib/auth";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Folder, Users, CheckCircle, BarChart3, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, isLoading, account, login, logout } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </main>
    );
  }

  // Authenticated - show dashboard preview
  if (isAuthenticated && account) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <nav className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-white text-xl font-semibold">Nexus Project Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-medium">{account.name}</p>
                <p className="text-slate-400 text-sm">{account.username}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-slate-400 hover:text-white">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </nav>

          {/* Welcome */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Xin chào, {account.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-slate-400">Chào mừng bạn đến với Nexus Project Hub</p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 cursor-pointer transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <Folder className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Projects</CardTitle>
                <CardDescription className="text-slate-400">
                  Xem và quản lý dự án của bạn
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 cursor-pointer transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">My Tasks</CardTitle>
                <CardDescription className="text-slate-400">
                  Công việc được giao cho bạn
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 cursor-pointer transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Team</CardTitle>
                <CardDescription className="text-slate-400">
                  Thành viên trong workspace
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 cursor-pointer transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-orange-400" />
                </div>
                <CardTitle className="text-white">Reports</CardTitle>
                <CardDescription className="text-slate-400">
                  Thống kê và báo cáo
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Coming Soon */}
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">🚀 Coming Soon</h3>
              <p className="text-slate-400">
                Smart Board, Gantt Chart, Teams Integration đang được phát triển...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not authenticated - show landing page
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-white text-xl font-semibold">Nexus Project Hub</span>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={login}>
            Sign In
          </Button>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Quản lý dự án
            </span>
            <br />
            thông minh hơn
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Tích hợp sâu với Microsoft 365. Đăng nhập bằng tài khoản công ty,
            nhận thông báo qua Teams, đồng bộ lịch với Outlook.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
              onClick={login}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="currentColor">
                <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" />
              </svg>
              Đăng nhập với Microsoft
            </Button>
            <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              Tìm hiểu thêm
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Folder className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Smart Board</CardTitle>
              <CardDescription className="text-slate-400">
                Kanban + Gantt Chart kết hợp, theo dõi tiến độ real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">Teams Integration</CardTitle>
              <CardDescription className="text-slate-400">
                Nhận thông báo, tạo task trực tiếp từ Microsoft Teams
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <CardTitle className="text-white">Resource Management</CardTitle>
              <CardDescription className="text-slate-400">
                Theo dõi workload, tránh quá tải cho team
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-400" />
              </div>
              <CardTitle className="text-white">AI Insights</CardTitle>
              <CardDescription className="text-slate-400">
                Tóm tắt tiến độ, dự đoán rủi ro bằng Azure OpenAI
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-slate-500">
            © 2026 Nexus Project Hub. Powered by Microsoft 365.
          </p>
        </div>
      </footer>
    </main>
  );
}
