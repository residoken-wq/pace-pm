"use client";

import { useAuth } from "@/lib/auth";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Shield, Lock, Activity, Smartphone, Globe, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SecurityDashboard() {
    const { account } = useAuth();

    // Mock Data
    const activeSessions = [
        { id: 1, device: "Windows PC", location: "Ho Chi Minh City, VN", browser: "Chrome", active: true, ip: "113.161.x.x" },
        { id: 2, device: "iPhone 14", location: "Ho Chi Minh City, VN", browser: "Safari", active: false, lastActive: "2 hours ago", ip: "171.244.x.x" },
    ];

    const auditLogs = [
        { id: 1, action: "Login Success", time: "Just now", ip: "113.161.x.x", status: "Success" },
        { id: 2, action: "File Upload", time: "5 mins ago", ip: "113.161.x.x", details: "Uploaded spec.pdf", status: "Success" },
        { id: 3, action: "Create Project", time: "1 hour ago", ip: "113.161.x.x", details: "New Project 'Alpha'", status: "Success" },
        { id: 4, action: "Failed Login", time: "Yesterday", ip: "14.161.x.x", details: "Wrong password", status: "Failed" },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Security Dashboard</h1>
                    <p className="text-muted-foreground">Manage your account security and monitor activity</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">MFA Status</CardTitle>
                        <Lock className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            Enabled <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Microsoft Authenticator active</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Password Strength</CardTitle>
                        <Shield className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">Strong</div>
                        <p className="text-xs text-muted-foreground mt-1">Last changed 45 days ago</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Activity className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2 Devices</div>
                        <p className="text-xs text-muted-foreground mt-1">Current session verification valid</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Active Sessions */}
                <Card className="col-span-1 border-border">
                    <CardHeader>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription>Devices logged into your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {activeSessions.map((session) => (
                            <div key={session.id} className="flex items-start gap-4">
                                <div className="p-2 bg-muted rounded-lg">
                                    {session.device.includes("iPhone") ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-sm">{session.device}</h4>
                                        {session.active && <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">Current</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{session.location}</span>
                                        <span>•</span>
                                        <span>{session.browser}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        IP: {session.ip}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Audit Log */}
                <Card className="col-span-1 lg:col-span-2 border-border">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Security audit log for your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Action</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3">Location/IP</th>
                                        <th className="px-4 py-3">Time</th>
                                        <th className="px-4 py-3 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">{log.action}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{log.details || "-"}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{log.ip}</td>
                                            <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> {log.time}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.status === "Success" ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle className="w-3 h-3" /> Success
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-destructive">
                                                        <AlertTriangle className="w-3 h-3" /> Failed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <Link href="/">
                    <Button variant="outline">
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
