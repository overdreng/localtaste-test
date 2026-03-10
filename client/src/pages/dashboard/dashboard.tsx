import { useState } from "react";
import { Sidebar, type DashboardTab } from "./Sidebar";
import { ProfileTab } from "./ProfileTab";
import { DishesTab } from "./DishesTab";
import { OrdersTab } from "./OrdersTab";
import { ReviewsTab } from "./ReviewsTab";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<DashboardTab>("profile");

    return (
        <div className="min-h-screen bg-background py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

                    <main className="flex-1">
                        {activeTab === "profile" && <ProfileTab />}
                        {activeTab === "dishes" && <DishesTab />}
                        {activeTab === "orders" && <OrdersTab />}
                        {activeTab === "reviews" && <ReviewsTab />}
                    </main>
                </div>
            </div>
        </div>
    );
}
