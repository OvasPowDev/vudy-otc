import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

const countries = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Ecuador", 
  "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", 
  "Panamá", "Paraguay", "Perú", "Uruguay", "Venezuela", "España"
];

const Profile = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("+54");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Schema para perfil
  const profileSchema = z.object({
    first_name: z.string().trim().max(100, "El nombre no puede tener más de 100 caracteres").optional(),
    last_name: z.string().trim().max(100, "El apellido no puede tener más de 100 caracteres").optional(),
    country: z.string().optional(),
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: {
      first_name: user?.firstName || "",
      last_name: user?.lastName || "",
      country: "",
    },
  });

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: [`/api/profiles/${user?.id}`],
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : "";
      await apiRequest(`/api/profiles/${user?.id}`, {
        method: 'PATCH',
        data: { ...data, phone: fullPhone },
      });
    },
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${user?.id}`] });
    },
    onError: (error: any) => {
      toast.error("Error al actualizar perfil: " + error.message);
    },
  });

  const handleProfileUpdate = async (data: any) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfileMutation.mutateAsync(data);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        currentLanguage={language} 
        onLanguageChange={setLanguage} 
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">Perfil</h2>
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
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4" data-testid="form-profile">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre" {...field} data-testid="input-firstname" />
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
                            <Input placeholder="Tu apellido" {...field} data-testid="input-lastname" />
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
                            <SelectTrigger data-testid="select-country">
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

                  <Button type="submit" disabled={loading} data-testid="button-save">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator />

          {/* Email Information (Read-only for now) */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Cuenta</CardTitle>
              <CardDescription>Tu email de acceso a la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={user.email} disabled data-testid="input-email" />
                <p className="text-xs text-muted-foreground">
                  Contacta a soporte para cambiar tu email
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
