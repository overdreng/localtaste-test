import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Dish } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DishForm = {
    name: string;
    price: string;
    photos: string;
    portions: string;
};

export function DishesTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: dishes, isLoading } = useQuery<Dish[]>({ queryKey: ["/api/cook/dishes"] });

    const [form, setForm] = useState<DishForm>({ name: "", price: "", photos: "", portions: "1" });

    const addDish = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/cook/dishes", {
                name: form.name,
                price: form.price,
                photos: form.photos ? [form.photos] : undefined,
                portions: Number(form.portions) || 1,
                availablePortions: Number(form.portions) || 1,
            });
        },
        onSuccess: () => {
            setForm({ name: "", price: "", photos: "", portions: "1" });
            queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] });
            toast({ title: "Dish added" });
        },
    });

    const updateDish = useMutation({
        mutationFn: ({ id, price, portions }: { id: number; price: string; portions: number }) =>
            apiRequest("PATCH", `/api/cook/dishes/${id}`, { price, portions, availablePortions: portions }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] });
            toast({ title: "Dish updated" });
        },
    });

    return (
        <div className="space-y-4">
            <Card className="rounded-xl shadow-sm">
                <CardHeader>
                    <CardTitle>Add Dish</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    <Input placeholder="Dish name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                    <Input placeholder="Photo URL" value={form.photos} onChange={(e) => setForm((p) => ({ ...p, photos: e.target.value }))} />
                    <Input placeholder="Portions" value={form.portions} onChange={(e) => setForm((p) => ({ ...p, portions: e.target.value }))} />
                    <div className="md:col-span-4">
                        <Button onClick={() => addDish.mutate()} disabled={addDish.isPending}>Add Dish</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {isLoading && <p>Loading dishes...</p>}
                {dishes?.map((dish) => (
                    <Card key={dish.id} className="rounded-xl shadow-sm overflow-hidden">
                        {dish.photos?.[0] && <img src={dish.photos[0]} alt={dish.name} className="h-40 w-full object-cover" />}
                        <CardContent className="p-4 space-y-2">
                            <h4 className="font-semibold">{dish.name}</h4>
                            <p className="text-sm text-muted-foreground">Price: {dish.price} ₸</p>
                            <p className="text-sm text-muted-foreground">Portions: {dish.portions}</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateDish.mutate({ id: dish.id, price: String(dish.price), portions: Number(dish.portions || 1) + 1 })}
                            >
                                Increase portions
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
