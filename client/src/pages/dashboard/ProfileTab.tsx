import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { CookProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProfileForm = {
    displayName: string;
    bio: string;
    specialization: string;
};

export function ProfileTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useQuery<CookProfile>({
        queryKey: ["/api/cook/profile"],
    });

    const [form, setForm] = useState<ProfileForm>({
        displayName: "",
        bio: "",
        specialization: "",
    });

    useEffect(() => {
        if (profile) {
            setForm({
                displayName: profile.displayName || "",
                bio: profile.bio || "",
                specialization: profile.specialization || "",
            });
        }
    }, [profile]);

    const updateProfile = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("PATCH", "/api/cook/profile", form);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cook/profile"] });
            toast({ title: "Profile updated" });
        },
        onError: () => {
            toast({ title: "Failed to update profile", variant: "destructive" });
        },
    });

    if (isLoading) {
        return <Card className="rounded-xl shadow-sm"><CardContent className="p-6">Loading...</CardContent></Card>;
    }

    if (!profile) {
        return <Card className="rounded-xl shadow-sm"><CardContent className="p-6">No cook profile found.</CardContent></Card>;
    }

    return (
        <Card className="rounded-xl shadow-sm">
            <CardHeader>
                <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Display Name</p>
                        <Input
                            value={form.displayName}
                            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Specialization</p>
                        <Input
                            value={form.specialization}
                            onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <Textarea
                        value={form.bio}
                        onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="text-sm text-muted-foreground">Cuisine Types</p>
                        <p className="font-medium">{profile.cuisineTypes?.join(", ") || "-"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-medium">{profile.experience || "-"}</p>
                    </div>
                </div>

                {profile.profileImage && (
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Profile Image</p>
                        <img src={profile.profileImage} alt={profile.displayName} className="h-24 w-24 rounded-xl object-cover border" />
                    </div>
                )}

                <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    );
}
