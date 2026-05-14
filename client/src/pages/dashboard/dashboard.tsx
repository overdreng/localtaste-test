import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { Sidebar, type DashboardTab } from "./Sidebar";
import { ProfileTab } from "./ProfileTab";
import { DishesTab } from "./DishesTab";
import { OrdersTab } from "./OrdersTab";
import { ReviewsTab } from "./ReviewsTab";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("profile");

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Cook Dashboard</h1>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 min-w-0">
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
