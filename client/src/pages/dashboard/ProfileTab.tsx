import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { CookProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Star, Package, TrendingUp, ChefHat } from "lucide-react";

type CookStats = {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  avgRating: string;
  reviewCount: number;
};

const completenessFields = [
  { key: "displayName", label: "Display name" },
  { key: "bio", label: "Bio" },
  { key: "specialization", label: "Specialization" },
  { key: "cuisineTypes", label: "Cuisine types" },
  { key: "profileImage", label: "Profile photo" },
  { key: "experience", label: "Experience" },
] as const;

export function ProfileTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery<CookProfile>({ queryKey: ["/api/cook/profile"] });
  const { data: stats } = useQuery<CookStats>({ queryKey: ["/api/cook/stats"] });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("21:00");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setSpecialization(profile.specialization || "");
      setIsAvailable(profile.isAvailable ?? true);
      setWorkStart(profile.workingHoursStart || "09:00");
      setWorkEnd(profile.workingHoursEnd || "21:00");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/cook/profile", {
        displayName, bio, specialization, isAvailable,
        workingHoursStart: workStart,
        workingHoursEnd: workEnd,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cook/profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-muted-foreground">No cook profile found.</div>;
  }

  // Profile completeness
  const filled = completenessFields.filter((f) => {
    const val = profile[f.key as keyof CookProfile];
    return val && (!Array.isArray(val) || (val as string[]).length > 0);
  });
  const pct = Math.round((filled.length / completenessFields.length) * 100);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{Number(stats?.totalRevenue || 0).toFixed(0)} ₸</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Package className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold">{stats?.deliveredOrders || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold">{stats?.avgRating || "—"}</p>
            <p className="text-xs text-muted-foreground">{stats?.reviewCount || 0} reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ChefHat className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">{stats?.pendingOrders || 0}</p>
            <p className="text-xs text-muted-foreground">Active Orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Completeness */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile completeness</span>
            <span className="text-sm font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2 mb-3" />
          <div className="grid grid-cols-2 gap-1.5">
            {completenessFields.map((f) => {
              const val = profile[f.key as keyof CookProfile];
              const done = val && (!Array.isArray(val) || (val as string[]).length > 0);
              return (
                <div key={f.key} className="flex items-center gap-1.5 text-xs">
                  {done
                    ? <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                    : <AlertCircle className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                  }
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Available for Orders</p>
            <p className="text-xs text-muted-foreground">Customers can place orders when enabled</p>
          </div>
          <Switch checked={isAvailable} onCheckedChange={setIsAvailable} data-testid="switch-available" />
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="input-display-name" />
          </div>
          <div>
            <Label>Specialization</Label>
            <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Georgian cuisine, Pastries" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell customers about yourself..." data-testid="textarea-bio" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Working from</Label>
              <Input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
            </div>
            <div>
              <Label>Working until</Label>
              <Input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
            </div>
          </div>

          {profile.profileImage && (
            <div>
              <Label className="mb-2 block">Profile Photo</Label>
              <img src={profile.profileImage} alt={profile.displayName} className="h-24 w-24 rounded-xl object-cover border" />
            </div>
          )}

          {profile.cuisineTypes && profile.cuisineTypes.length > 0 && (
            <div>
              <Label className="mb-2 block">Cuisine Types</Label>
              <div className="flex flex-wrap gap-1">
                {profile.cuisineTypes.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            </div>
          )}

          <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} data-testid="button-save-profile">
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Cook status:</span>
        <Badge variant={profile.status === "approved" ? "default" : profile.status === "rejected" ? "destructive" : "secondary"}>
          {profile.status}
        </Badge>
        {profile.status === "pending" && <span className="text-xs">Under review by moderators</span>}
      </div>
    </div>
  );
}
