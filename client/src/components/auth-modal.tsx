import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, ChefHat } from "lucide-react";
import { SiReplit } from "react-icons/si";

type AuthMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
}

export function AuthModal({ open, onOpenChange, defaultMode = "login" }: AuthModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setError("");
    }
  }, [open, defaultMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<"client" | "cook">("client");
  const [error, setError] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setAddress("");
    setRole("client");
    setError("");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          setError(t("passwords_dont_match"));
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(t("password_min"));
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName, phone, address, role }),
          credentials: "include",
        });

        if (res.status === 409) {
          setError(t("email_taken"));
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          setError(data.message || "Registration failed");
          setIsLoading(false);
          return;
        }

        toast({ title: t("registration_success") });
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });

        if (!res.ok) {
          setError(t("login_error"));
          setIsLoading(false);
          return;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      resetForm();
      onOpenChange(false);

      if (mode === "register" && role === "cook") {
        window.location.href = "/become-cook";
      }
    } catch (err) {
      setError(mode === "login" ? t("login_error") : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-auth-title">
            {mode === "login" ? t("login_title") : t("register_title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" ? t("login_subtitle") : t("register_subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">{t("register_as")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={role === "client" ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col items-center gap-1"
                    onClick={() => setRole("client")}
                    data-testid="button-role-client"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-xs">{t("role_client")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={role === "cook" ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col items-center gap-1"
                    onClick={() => setRole("cook")}
                    data-testid="button-role-cook"
                  >
                    <ChefHat className="h-5 w-5" />
                    <span className="text-xs">{t("role_cook")}</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">{t("first_name")}</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t("last_name")}</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
          </div>

          {mode === "register" && (
            <div>
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phone_placeholder")}
                data-testid="input-phone"
              />
            </div>
          )}

          {mode === "register" && role === "client" && (
            <div>
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("address_placeholder")}
                data-testid="input-address"
              />
            </div>
          )}

          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? 6 : 1}
              data-testid="input-password"
            />
          </div>

          {mode === "register" && (
            <div>
              <Label htmlFor="confirmPassword">{t("confirm_password")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" data-testid="text-auth-error">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-auth-submit">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? t("login") : t("register")}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("or_login_with")}</span>
          </div>
        </div>

        <a href="/api/login" className="block">
          <Button variant="outline" className="w-full" type="button" data-testid="button-replit-auth">
            <SiReplit className="mr-2 h-4 w-4" />
            {t("replit_auth")}
          </Button>
        </a>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? t("dont_have_account") : t("already_have_account")}{" "}
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline font-medium"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            data-testid="button-switch-auth-mode"
          >
            {mode === "login" ? t("register") : t("login")}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
