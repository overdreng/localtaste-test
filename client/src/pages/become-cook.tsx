import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, ChefHat, Upload, Star, ArrowRight, CheckCircle,
  Clock, Users, BarChart2, Award, Banknote, Zap, Quote,
} from "lucide-react";
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

const BENEFITS = [
  {
    icon: <Banknote className="h-6 w-6 text-green-600" />,
    bg: "bg-green-50 dark:bg-green-950/30",
    title: { en: "Set Your Own Prices", ru: "Сами устанавливаете цены" },
    desc: { en: "Price your dishes as you see fit. No hidden fees, no surprises.", ru: "Устанавливайте цены на свои блюда самостоятельно. Без скрытых сборов." },
  },
  {
    icon: <Clock className="h-6 w-6 text-blue-600" />,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    title: { en: "Flexible Schedule", ru: "Гибкий график" },
    desc: { en: "Cook when you want. Set your working hours and availability.", ru: "Готовьте когда хотите. Сами задаёте рабочие часы и доступность." },
  },
  {
    icon: <Zap className="h-6 w-6 text-amber-600" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    title: { en: "Free to Start", ru: "Бесплатный старт" },
    desc: { en: "Zero startup costs. Join, set up your profile and start earning.", ru: "Никаких стартовых вложений. Зарегистрируйтесь и начните зарабатывать." },
  },
  {
    icon: <Users className="h-6 w-6 text-purple-600" />,
    bg: "bg-purple-50 dark:bg-purple-950/30",
    title: { en: "Built-in Customer Base", ru: "Готовая аудитория" },
    desc: { en: "Access hundreds of hungry customers already on the platform.", ru: "Доступ к сотням голодных клиентов, уже зарегистрированных на платформе." },
  },
  {
    icon: <BarChart2 className="h-6 w-6 text-rose-600" />,
    bg: "bg-rose-50 dark:bg-rose-950/30",
    title: { en: "Track Your Earnings", ru: "Следите за доходом" },
    desc: { en: "A personal dashboard with real-time stats, orders, and revenue.", ru: "Личная панель с актуальной статистикой, заказами и выручкой." },
  },
  {
    icon: <Award className="h-6 w-6 text-orange-600" />,
    bg: "bg-orange-50 dark:bg-orange-950/30",
    title: { en: "Build Your Brand", ru: "Развивайте свой бренд" },
    desc: { en: "Get your own cook profile, ratings, and loyal customer reviews.", ru: "Ваш профиль повара, рейтинг и постоянные клиенты." },
  },
];

const COOK_STEPS = [
  {
    emoji: "📝",
    title: { en: "Apply & Get Verified", ru: "Подайте заявку" },
    desc: { en: "Fill in your profile. Our team reviews applications within 24 hours.", ru: "Заполните профиль. Команда рассматривает заявки в течение 24 часов." },
  },
  {
    emoji: "🍽️",
    title: { en: "Add Your Dishes", ru: "Добавьте блюда" },
    desc: { en: "Upload photos, set prices, describe your meals. Your menu, your rules.", ru: "Загрузите фото, установите цены, опишите блюда. Ваше меню — ваши правила." },
  },
  {
    emoji: "💰",
    title: { en: "Start Receiving Orders", ru: "Получайте заказы" },
    desc: { en: "Customers place orders directly. You cook, they enjoy, you earn.", ru: "Клиенты делают заказы напрямую. Вы готовите — они наслаждаются — вы зарабатываете." },
  },
];

const COOK_TESTIMONIALS = [
  {
    name: "Aigerim N.",
    avatar: "A",
    city: { en: "Almaty", ru: "Алматы" },
    text: {
      en: "I started cooking beshbarmak from home and now I earn ₸60,000 a month. My regular customers keep coming back!",
      ru: "Начала готовить бешбармак дома и теперь зарабатываю 60 000 ₸ в месяц. Постоянные клиенты возвращаются снова и снова!",
    },
    earnings: "₸60,000/мес",
    rating: 4.9,
  },
  {
    name: "Marat S.",
    avatar: "M",
    city: { en: "Almaty", ru: "Алматы" },
    text: {
      en: "My lagman recipe has been in the family for generations. Now I share it with the whole city. Amazing feeling!",
      ru: "Мой рецепт лагмана передаётся в семье из поколения в поколение. Теперь делюсь им со всем городом. Невероятное ощущение!",
    },
    earnings: "₸45,000/мес",
    rating: 4.8,
  },
  {
    name: "Gulnur A.",
    avatar: "G",
    city: { en: "Almaty", ru: "Алматы" },
    text: {
      en: "Finally doing what I love and getting paid for it. The dashboard makes it easy to manage everything.",
      ru: "Наконец занимаюсь любимым делом и получаю за это деньги. Панель управления упрощает всё.",
    },
    earnings: "₸38,000/мес",
    rating: 4.7,
  },
];

export default function BecomeCookPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const { t, lang } = useTranslation();

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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">{t("become_cook_title")}</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-5 bg-primary/15 text-primary border-primary/20">
              <ChefHat className="h-3.5 w-3.5 mr-1" />
              {lang === "ru" ? "Стать поваром" : "Become a Cook"}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">{t("bc_hero_title")}</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{t("bc_hero_desc")}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: "💰", value: t("bc_avg_earnings"), label: lang === "ru" ? "средний заработок" : "average earnings" },
                { icon: "🆓", value: t("bc_free_to_join"), label: lang === "ru" ? "регистрация" : "to get started" },
                { icon: "👥", value: t("bc_active_customers"), label: lang === "ru" ? "активных клиентов" : "active customers" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-background/70 backdrop-blur-sm border rounded-xl px-4 py-3"
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{t("bc_benefits_title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">{t("bc_benefits_desc")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className={`rounded-xl p-5 ${benefit.bg} border border-transparent`}>
                <div className="mb-3">{benefit.icon}</div>
                <h3 className="font-semibold mb-2">{lang === "ru" ? benefit.title.ru : benefit.title.en}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === "ru" ? benefit.desc.ru : benefit.desc.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works for cooks */}
      <section className="py-16 bg-card border-y">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{t("bc_how_title")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {COOK_STEPS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-5">
                  {step.emoji}
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-3">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {lang === "ru" ? step.title.ru : step.title.en}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === "ru" ? step.desc.ru : step.desc.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cook Testimonials */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">{t("bc_cook_testimonials")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {COOK_TESTIMONIALS.map((item, i) => (
              <Card key={i} className="relative">
                <CardContent className="pt-6 pb-5 px-5">
                  <Quote className="h-7 w-7 text-primary/20 mb-3" />
                  <p className="text-sm leading-relaxed text-muted-foreground italic mb-5">
                    "{lang === "ru" ? item.text.ru : item.text.en}"
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {item.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ru" ? item.city.ru : item.city.en}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30">
                      {item.earnings}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{item.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-card border-t" id="apply">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ChefHat className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("bc_form_title")}</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{t("bc_form_desc")}</p>
          </div>

          <Card>
            <CardContent className="py-7 px-6">
              {/* Checklist */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                {[
                  lang === "ru" ? "Быстрая проверка (24ч)" : "Quick review (24h)",
                  lang === "ru" ? "Бесплатно" : "Completely free",
                  lang === "ru" ? "Поддержка команды" : "Team support",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

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
                        <img src={profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
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
                          <Textarea placeholder={t("about_placeholder")} className="resize-none" rows={3} {...field} data-testid="input-bio" />
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
                          <Textarea placeholder={t("experience_placeholder")} className="resize-none" rows={3} {...field} data-testid="input-experience" />
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
                    {submitApplication.isPending ? t("submitting") : (
                      <>
                        {t("submit_application")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
