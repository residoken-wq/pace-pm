"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { X, ArrowRight, CheckCircle, Folder, Calendar } from "lucide-react";

export function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeen = localStorage.getItem("has_seen_onboarding");
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem("has_seen_onboarding", "true");
        setIsOpen(false);
    };

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    if (!isOpen) return null;

    const steps = [
        {
            title: "Chào mừng đến với Nexus! 👋",
            description: "Giải pháp quản lý dự án toàn diện dành cho doanh nghiệp của bạn. Hãy cùng điểm qua các tính năng nổi bật.",
            icon: <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mb-6 shadow-lg"><span className="text-3xl font-bold text-white">N</span></div>
        },
        {
            title: "Quản lý Dự án Thông minh",
            description: "Tạo dự án, thêm thành viên và quản lý công việc với giao diện Kanban trực quan. Kéo thả để cập nhật tiến độ.",
            icon: <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-6"><Folder className="w-8 h-8 text-blue-600 dark:text-blue-400" /></div>
        },
        {
            title: "Tích hợp Microsoft 365",
            description: "Đồng bộ công việc với Outlook Calendar và Microsoft To-Do. Nhận thông báo trực tiếp qua Teams.",
            icon: <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-6"><Calendar className="w-8 h-8 text-violet-600 dark:text-violet-400" /></div>
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    {steps[step].icon}

                    <h2 className="text-2xl font-bold mb-3">{steps[step].title}</h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                        {steps[step].description}
                    </p>

                    <div className="flex gap-2 mb-8">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "bg-muted"}`}
                            />
                        ))}
                    </div>

                    <div className="w-full flex gap-3">
                        {step > 0 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                                Quay lại
                            </Button>
                        )}
                        <Button onClick={handleNext} className="flex-1 bg-gradient-brand text-white border-none">
                            {step === 2 ? "Bắt đầu ngay" : "Tiếp theo"}
                            {step !== 2 && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
