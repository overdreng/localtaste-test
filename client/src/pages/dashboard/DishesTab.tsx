import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Dish } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Check, ChefHat, DollarSign, Clock, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type DishForm = {
  name: string;
  description: string;
  price: string;
  cookingTime: string;
  weight: string;
  cuisineType: string;
  photos: string;
  availablePortions: string;
  ingredients: string;
};

const emptyForm: DishForm = {
  name: "", description: "", price: "", cookingTime: "",
  weight: "", cuisineType: "", photos: "", availablePortions: "10", ingredients: "",
};

export function DishesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: dishes, isLoading } = useQuery<Dish[]>({ queryKey: ["/api/cook/dishes"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DishForm>(emptyForm);

  const f = (key: keyof DishForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const addDish = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/cook/dishes", {
        name: form.name,
        description: form.description || undefined,
        price: form.price,
        cookingTime: form.cookingTime ? Number(form.cookingTime) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        cuisineType: form.cuisineType || undefined,
        photos: form.photos ? [form.photos] : undefined,
        availablePortions: Number(form.availablePortions) || 10,
        ingredients: form.ingredients || undefined,
      }),
    onSuccess: () => {
      setForm(emptyForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] });
      toast({ title: "Dish added successfully" });
    },
    onError: () => toast({ title: "Failed to add dish", variant: "destructive" }),
  });

  const updateDish = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Dish> }) =>
      apiRequest("PATCH", `/api/cook/dishes/${id}`, data),
    onSuccess: () => {
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] });
      toast({ title: "Dish updated" });
    },
    onError: () => toast({ title: "Failed to update dish", variant: "destructive" }),
  });

  const toggleAvailable = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      apiRequest("PATCH", `/api/cook/dishes/${id}`, { isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] }),
  });

  const deleteDish = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cook/dishes/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] });
      toast({ title: "Dish removed" });
    },
    onError: () => toast({ title: "Failed to remove dish", variant: "destructive" }),
  });

  const openEdit = (dish: Dish) => {
    setEditingId(dish.id);
    setForm({
      name: dish.name,
      description: dish.description || "",
      price: String(dish.price),
      cookingTime: dish.cookingTime ? String(dish.cookingTime) : "",
      weight: dish.weight ? String(dish.weight) : "",
      cuisineType: dish.cuisineType || "",
      photos: dish.photos?.[0] || "",
      availablePortions: String(dish.availablePortions || 10),
      ingredients: dish.ingredients || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateDish.mutate({
        id: editingId,
        data: {
          name: form.name,
          description: form.description || undefined,
          price: form.price as any,
          cookingTime: form.cookingTime ? Number(form.cookingTime) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          cuisineType: form.cuisineType || undefined,
          photos: form.photos ? [form.photos] : undefined,
          availablePortions: Number(form.availablePortions) || 10,
          ingredients: form.ingredients || undefined,
        },
      });
    } else {
      addDish.mutate();
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Dishes</h2>
          <p className="text-sm text-muted-foreground">{dishes?.length || 0} dishes in your menu</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }} data-testid="button-add-dish">
          <Plus className="h-4 w-4 mr-2" />
          Add Dish
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Dish" : "Add New Dish"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Dish Name *</Label>
                <Input placeholder="e.g. Homemade Borscht" {...f("name")} required data-testid="input-dish-name" />
              </div>
              <div>
                <Label>Price (₸) *</Label>
                <Input type="number" placeholder="0" min="0" {...f("price")} required data-testid="input-dish-price" />
              </div>
              <div>
                <Label>Portions Available</Label>
                <Input type="number" min="0" {...f("availablePortions")} data-testid="input-dish-portions" />
              </div>
              <div>
                <Label>Cooking Time (min)</Label>
                <Input type="number" placeholder="30" min="0" {...f("cookingTime")} />
              </div>
              <div>
                <Label>Weight (g)</Label>
                <Input type="number" placeholder="300" min="0" {...f("weight")} />
              </div>
              <div className="col-span-2">
                <Label>Cuisine Type</Label>
                <Input placeholder="e.g. Georgian, Russian, Italian" {...f("cuisineType")} />
              </div>
              <div className="col-span-2">
                <Label>Photo URL</Label>
                <Input type="url" placeholder="https://..." {...f("photos")} data-testid="input-dish-photo" />
                {form.photos && (
                  <img src={form.photos} alt="Preview" className="mt-2 h-28 w-full object-cover rounded-md" onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
              </div>
              <div className="col-span-2">
                <Label>Ingredients</Label>
                <Textarea placeholder="List main ingredients..." {...f("ingredients")} rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe this dish..." {...f("description")} rows={3} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" disabled={addDish.isPending || updateDish.isPending}>
                {editingId ? "Save Changes" : "Add Dish"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dish list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !dishes?.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <ChefHat className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No dishes yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Add your first dish to start receiving orders</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {dishes.map((dish) => (
            <Card key={dish.id} className={`overflow-hidden rounded-xl ${!dish.isAvailable ? "opacity-60" : ""}`} data-testid={`card-dish-${dish.id}`}>
              {dish.photos?.[0] ? (
                <div className="relative h-36 bg-muted">
                  <img src={dish.photos[0]} alt={dish.name} className="h-full w-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={dish.isAvailable ? "default" : "secondary"} className="text-xs">
                      {dish.isAvailable ? "Available" : "Hidden"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-20 bg-muted/50 flex items-center justify-center">
                  <ChefHat className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold truncate">{dish.name}</h4>
                  {dish.cuisineType && <p className="text-xs text-muted-foreground">{dish.cuisineType}</p>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    {Number(dish.price).toFixed(0)} ₸
                  </span>
                  {dish.cookingTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dish.cookingTime}m</span>}
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" />{dish.availablePortions || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={dish.isAvailable ?? true}
                      onCheckedChange={(checked) => toggleAvailable.mutate({ id: dish.id, isAvailable: checked })}
                      data-testid={`switch-available-${dish.id}`}
                    />
                    <span className="text-xs text-muted-foreground">Show in menu</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(dish)} data-testid={`button-edit-dish-${dish.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteDish.mutate(dish.id)}
                      data-testid={`button-delete-dish-${dish.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
