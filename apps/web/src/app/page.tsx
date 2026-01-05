import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui"
import { Folder, Users, CheckCircle, BarChart3 } from "lucide-react"

export default function Home() {
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
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
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
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8">
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
  )
}
