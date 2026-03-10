import { User, UtensilsCrossed, ClipboardList, Star } from "lucide-react";

export type DashboardTab = "profile" | "dishes" | "orders" | "reviews";

interface SidebarProps {
    activeTab: DashboardTab;
    onTabChange: (tab: DashboardTab) => void;
}

const items: { key: DashboardTab; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "dishes", label: "My Dishes", icon: UtensilsCrossed },
    { key: "orders", label: "Orders", icon: ClipboardList },
    { key: "reviews", label: "Reviews", icon: Star },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside className="w-full lg:w-72 rounded-xl border bg-card shadow-sm p-4 lg:p-5 h-fit">
            <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
            <div className="space-y-2">
                {items.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => onTabChange(key)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === key
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-foreground"
                            }`}
                        data-testid={`dashboard-tab-${key}`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>
        </aside>
    );
}
