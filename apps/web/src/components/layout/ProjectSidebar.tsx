import {
    LayoutDashboard,
    ListTodo,
    KanbanSquare,
    GanttChartSquare,
    CalendarDays,
    Users,
    Settings,
    ChevronLeft,
    Clock,
    Newspaper,
    MessagesSquare
} from "lucide-react";

export type SidebarView = "overview" | "activity" | "work_packages" | "boards" | "gantt" | "calendars" | "team_planners" | "meetings" | "news" | "team" | "settings";

interface ProjectSidebarProps {
    isOpen: boolean;
    projectName: string;
    activeView: SidebarView;
    onViewChange: (view: SidebarView) => void;
    onToggle: () => void;
}

export function ProjectSidebar({ isOpen, projectName, activeView, onViewChange, onToggle }: ProjectSidebarProps) {
    const mainMenuItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "activity", label: "Activity", icon: Clock, className: "text-muted-foreground" },
        { id: "work_packages", label: "Work packages", icon: ListTodo },
        { id: "gantt", label: "Gantt charts", icon: GanttChartSquare, className: "text-muted-foreground" },
        { id: "calendars", label: "Calendars", icon: CalendarDays, className: "text-muted-foreground" },
        { id: "team_planners", label: "Team planners", icon: Users, className: "text-muted-foreground" },
        { id: "boards", label: "Boards", icon: KanbanSquare },
        { id: "meetings", label: "Meetings", icon: MessagesSquare, className: "text-muted-foreground" },
        { id: "news", label: "News", icon: Newspaper, className: "text-muted-foreground" },
        { id: "team", label: "Team", icon: Users },
        { id: "settings", label: "Project settings", icon: Settings, className: "mt-4" },
    ];

    return (
        <aside
            className={`${isOpen ? "w-64" : "w-0 opacity-0"
                } bg-card border-r border-border flex flex-col transition-all duration-300 overflow-hidden relative group`}
        >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                {/* This would be the project switcher or project name title */}
                <div className="font-semibold text-sm truncate pr-2" title={projectName}>
                    {projectName}
                </div>
                <button onClick={onToggle} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {mainMenuItems.map((item) => {
                    const isActive = activeView === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id as SidebarView)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                ? "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted border-l-4 border-transparent"
                                } ${item.className || ""}`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="truncate">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
