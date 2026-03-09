import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChefHat, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useUpload } from "@/hooks/use-upload";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

interface CookFormValues {
  displayName: string;
  bio: string;
  specialization: string;
  cuisineTypes: string;
  experience: string;
}

export default function BecomeCookPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const { t } = useTranslation();

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setProfileImageUrl(response.objectPath);
      toast({ title: t("photo_uploaded") });
    },
    onError: () => {
      toast({ title: t("upload_failed"), variant: "destructive" });
    },
  });

  const form = useForm<CookFormValues>({
    defaultValues: {
      displayName: "",
      bio: "",
      specialization: "",
      cuisineTypes: "",
      experience: "",
    },
  });

  const submitApplication = useMutation({
    mutationFn: (values: CookFormValues) =>
      apiRequest("POST", "/api/cook-profiles", {
        displayName: values.displayName,
        bio: values.bio,
        specialization: values.specialization,
        cuisineTypes: values.cuisineTypes.split(",").map((s) => s.trim()).filter(Boolean),
        experience: values.experience,
        profileImage: profileImageUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({ title: t("application_submitted"), description: t("application_review") });
      navigate("/");
    },
    onError: () => {
      toast({ title: t("error"), description: t("application_error"), variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">{t("become_cook_title")}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("share_talent")}</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("become_cook_page_desc")}
          </p>
        </div>

        <Card>
          <CardContent className="py-6 px-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => submitApplication.mutate(values))}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="displayName"
                  rules={{ required: t("display_name") + " *" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("display_name")} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t("display_name_placeholder")} {...field} data-testid="input-display-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="text-sm font-medium block mb-2">{t("profile_photo")}</label>
                  <div className="flex items-center gap-4">
                    {profileImageUrl && (
                      <img src={profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) uploadFile(file);
                        };
                        input.click();
                      }}
                      disabled={isUploading}
                      data-testid="button-upload-photo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? t("uploading") : t("upload_photo")}
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("about_you")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("about_placeholder")} className="resize-none" {...field} data-testid="input-bio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("specialization")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("specialization_placeholder")} {...field} data-testid="input-specialization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cuisineTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cuisine_types")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("cuisine_types_placeholder")} {...field} data-testid="input-cuisine-types" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("experience")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("experience_placeholder")} className="resize-none" {...field} data-testid="input-experience" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitApplication.isPending}
                  data-testid="button-submit-application"
                >
                  {submitApplication.isPending ? t("submitting") : t("submit_application")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
