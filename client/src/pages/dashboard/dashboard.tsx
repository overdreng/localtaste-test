import { useState } from "react";

export default function Dashboard() {
    const [tab, setTab] = useState("profile");

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Sidebar */}
            <div className="w-64 bg-white border-r p-6">
                <h2 className="text-xl font-bold mb-6">Панель повара</h2>

                <button
                    onClick={() => setTab("profile")}
                    className="block mb-3 text-left w-full"
                >
                    Профиль
                </button>

                <button
                    onClick={() => setTab("dishes")}
                    className="block mb-3 text-left w-full"
                >
                    Мои блюда
                </button>

                <button
                    onClick={() => setTab("orders")}
                    className="block mb-3 text-left w-full"
                >
                    Заказы
                </button>

                <button
                    onClick={() => setTab("reviews")}
                    className="block text-left w-full"
                >
                    Отзывы
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-10">
                {tab === "profile" && <div>Профиль повара</div>}
                {tab === "dishes" && <div>Список блюд</div>}
                {tab === "orders" && <div>Заказы</div>}
                {tab === "reviews" && <div>Отзывы</div>}
            </div>
        </div>
    );
}