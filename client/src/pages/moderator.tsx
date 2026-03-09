import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Shield, ChefHat, CheckCircle, XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { CookProfile, User } from "@shared/schema";

type CookWithUser = CookProfile & { user: User };

export default function ModeratorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [rejectCook, setRejectCook] = useState<CookWithUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingCooks, isLoading } = useQuery<CookWithUser[]>({
    queryKey: ["/api/admin/cooks/pending"],
  });

  const updateCookStatus = useMutation({
    mutationFn: ({ cookId, status, reason }: { cookId: number; status: string; reason?: string }) =>
      apiRequest("PATCH", `/api/admin/cooks/${cookId}/status`, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cooks/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cooks"] });
      toast({ title: t("cook_status_updated") });
    },
    onError: () => {
      toast({ title: t("error"), description: t("update_error"), variant: "destructive" });
    },
  });

  const handleReject = (cook: CookWithUser) => {
    setRejectCook(cook);
    setRejectionReason("");
  };

  const confirmReject = () => {
    if (rejectCook) {
      updateCookStatus.mutate({ cookId: rejectCook.id, status: "rejected", reason: rejectionReason || undefined });
      setRejectCook(null);
      setRejectionReason("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">{t("moderator_panel")}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-1">{t("cook_applications")}</h2>
          <p className="text-sm text-muted-foreground">{t("review_applications_desc")}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : pendingCooks && pendingCooks.length > 0 ? (
          <div className="space-y-4">
            {pendingCooks.map((cook) => (
              <Card key={cook.id} data-testid={`card-pending-cook-${cook.id}`}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-4 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
                      <AvatarFallback><ChefHat className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">{cook.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cook.user?.email}
                      </p>
                      {cook.specialization && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {cook.specialization}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{t("status_pending")}</Badge>
                  </div>

                  {cook.cuisineTypes && cook.cuisineTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cook.cuisineTypes.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}

                  {cook.bio && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t("bio_label")}</p>
                      <p className="text-sm leading-relaxed">{cook.bio}</p>
                    </div>
                  )}

                  {cook.experience && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t("experience_label")}</p>
                      <p className="text-sm leading-relaxed">{cook.experience}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      onClick={() => updateCookStatus.mutate({ cookId: cook.id, status: "approved" })}
                      disabled={updateCookStatus.isPending}
                      data-testid={`button-approve-${cook.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t("approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(cook)}
                      disabled={updateCookStatus.isPending}
                      data-testid={`button-reject-${cook.id}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t("reject")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("no_pending")}</h3>
          </div>
        )}
      </main>

      <Dialog open={!!rejectCook} onOpenChange={() => setRejectCook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject")} — {rejectCook?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium block mb-2">{t("rejection_reason")}</label>
            <Textarea
              placeholder={t("rejection_reason_placeholder")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="resize-none"
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectCook(null)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={confirmReject} data-testid="button-confirm-reject">
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
