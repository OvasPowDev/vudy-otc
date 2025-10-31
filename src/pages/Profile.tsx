import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { CountryPhoneInput } from "@/components/CountryPhoneInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const countries = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Ecuador", 
  "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", 
  "Panamá", "Paraguay", "Perú", "Uruguay", "Venezuela", "España"
];

const Profile = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("+54");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Schema para perfil
  const profileSchema = z.object({
    first_name: z.string().trim().max(100, "El nombre no puede tener más de 100 caracteres").optional(),
    last_name: z.string().trim().max(100, "El apellido no puede tener más de 100 caracteres").optional(),
    country: z.string().optional(),
  });

  // Schema para email
  const emailSchema = z.object({
    email: z.string()
      .min(1, { message: t('auth.errors.emailRequired') })
      .email({ message: t('auth.errors.emailInvalid') }),
  });

  // Schema para contraseña
  const passwordSchema = z.object({
    currentPassword: z.string()
      .min(1, { message: t('auth.errors.passwordRequired') })
      .min(6, { message: t('auth.errors.passwordTooShort') }),
    newPassword: z.string()
      .min(1, { message: t('auth.errors.passwordRequired') })
      .min(6, { message: t('auth.errors.passwordTooShort') }),
    confirmPassword: z.string()
      .min(1, { message: t('auth.errors.confirmPasswordRequired') }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.errors.passwordsDontMatch'),
    path: ["confirmPassword"],
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: {
      first_name: "",
      last_name: "",
      country: "",
    },
  });

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        emailForm.setValue("email", session.user.email || "");
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Parse phone number into country code and number
        const phone = data.phone || "";
        const phoneMatch = phone.match(/^(\+\d+)\s*(.*)$/);
        if (phoneMatch) {
          setCountryCode(phoneMatch[1]);
          setPhoneNumber(phoneMatch[2]);
        } else {
          setPhoneNumber(phone);
        }

        profileForm.reset({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          country: data.country || "",
        });
      }
    } catch (error: any) {
      toast.error("Error al cargar el perfil: " + error.message);
    }
  };

  const handleProfileUpdate = async (data: any) => {
    if (!user) return;

    try {
      setLoading(true);
      const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : "";

      const { error } = await supabase
        .from("profiles")
        .update({ ...data, phone: fullPhone })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil actualizado correctamente");
    } catch (error: any) {
      toast.error("Error al actualizar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (data: any) => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (error) throw error;

      toast.success("Email actualizado. Por favor verifica tu nuevo correo.");
    } catch (error: any) {
      toast.error("Error al actualizar email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (data: any) => {
    if (!user) return;

    try {
      setLoading(true);

      // Verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error("La contraseña actual es incorrecta");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success("Contraseña actualizada correctamente");
      passwordForm.reset();
    } catch (error: any) {
      toast.error("Error al actualizar contraseña: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        user={user} 
        currentLanguage={language} 
        onLanguageChange={setLanguage} 
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Perfil</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona tu información personal y configuración de cuenta
            </p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu información de perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu apellido" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <CountryPhoneInput
                      countryCode={countryCode}
                      phoneNumber={phoneNumber}
                      onCountryCodeChange={setCountryCode}
                      onPhoneNumberChange={setPhoneNumber}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tu país" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator />

          {/* Email Change */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Email</CardTitle>
              <CardDescription>Actualiza tu dirección de correo electrónico</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nuevo Email <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@email.com" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Actualizar Email
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator />

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Contraseña Actual <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nueva Contraseña <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Confirmar Nueva Contraseña <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cambiar Contraseña
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;