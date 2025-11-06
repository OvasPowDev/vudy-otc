import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, Building2, User, Lock, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import { CountryPhoneInput } from "@/components/CountryPhoneInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Profile as ProfileType } from "@shared/schema";

const countries = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Ecuador", 
  "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", 
  "Panamá", "Paraguay", "Perú", "Uruguay", "Venezuela", "España"
];

const Profile = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [countryCode, setCountryCode] = useState("+54");
  const [phoneNumber, setPhoneNumber] = useState("");
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  // Schema para perfil personal
  const profileSchema = z.object({
    first_name: z.string().trim().max(100, "El nombre no puede tener más de 100 caracteres").optional(),
    last_name: z.string().trim().max(100, "El apellido no puede tener más de 100 caracteres").optional(),
    country: z.string().optional(),
  });

  // Schema para datos de empresa
  const companySchema = z.object({
    companyName: z.string().trim().min(1, "El nombre de la empresa es requerido").max(200),
    companyAddress: z.string().trim().max(500).optional(),
    companyWebsite: z.string().trim().url("Debe ser una URL válida").or(z.literal("")).optional(),
    companyPhone: z.string().trim().optional(),
    companyEmail: z.string().trim().email("Debe ser un email válido").optional(),
  });

  // Schema para cambio de password
  const passwordSchema = z.object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
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

  const companyForm = useForm({
    resolver: zodResolver(companySchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "",
      companyAddress: "",
      companyWebsite: "",
      companyPhone: "",
      companyEmail: "",
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

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileType>({
    queryKey: [`/api/profiles/${user?.id}`],
    enabled: !!user?.id,
  });

  // Update forms when profile data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        first_name: profile.firstName || "",
        last_name: profile.lastName || "",
        country: profile.country || "",
      });

      companyForm.reset({
        companyName: profile.companyName || "",
        companyAddress: profile.companyAddress || "",
        companyWebsite: profile.companyWebsite || "",
        companyPhone: profile.companyPhone || "",
        companyEmail: profile.companyEmail || "",
      });

      if (profile.phone) {
        const parts = profile.phone.split(" ");
        if (parts.length >= 2) {
          setCountryCode(parts[0]);
          setPhoneNumber(parts.slice(1).join(" "));
        }
      }

      if (profile.profilePhoto) {
        setProfilePhotoPreview(profile.profilePhoto);
      }

      if (profile.companyLogo) {
        setCompanyLogoPreview(profile.companyLogo);
      }
    }
  }, [profile, profileForm, companyForm]);

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

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await apiRequest(`/api/profiles/${user?.id}/change-password`, {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error("Error al cambiar contraseña: " + error.message);
    },
  });

  const handleProfileUpdate = async (data: any) => {
    if (!user) return;
    await updateProfileMutation.mutateAsync(data);
  };

  const handleCompanyUpdate = async (data: any) => {
    if (!user) return;
    await updateProfileMutation.mutateAsync(data);
  };

  const handlePasswordChange = async (data: any) => {
    if (!user) return;
    await changePasswordMutation.mutateAsync({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Read file as base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Set preview immediately
      setProfilePhotoPreview(base64String);
      
      // Upload to server
      await updateProfileMutation.mutateAsync({ profilePhoto: base64String });
      toast.success("Foto de perfil actualizada");
    } catch (error: any) {
      toast.error("Error al subir la foto: " + error.message);
      setProfilePhotoPreview(""); // Reset preview on error
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      // Read file as base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Set preview immediately
      setCompanyLogoPreview(base64String);
      
      // Upload to server
      await updateProfileMutation.mutateAsync({ companyLogo: base64String });
      toast.success("Logo de empresa actualizado");
    } catch (error: any) {
      toast.error("Error al subir el logo: " + error.message);
      setCompanyLogoPreview(""); // Reset preview on error
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || profileLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        currentLanguage={language} 
        onLanguageChange={setLanguage} 
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">Perfil</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona tu información personal, datos de empresa y configuración de cuenta
            </p>
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="gap-2" data-testid="tab-personal">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-2" data-testid="tab-photos">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Fotos</span>
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-2" data-testid="tab-company">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Empresa</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Seguridad</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
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
                        <Label htmlFor="phone">Teléfono Personal</Label>
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

                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={user.email} disabled data-testid="input-email" />
                        <p className="text-xs text-muted-foreground">
                          Contacta a soporte para cambiar tu email
                        </p>
                      </div>

                      <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-personal">
                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Photo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Foto de Perfil</CardTitle>
                    <CardDescription>Sube tu foto de perfil personal</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-32 w-32">
                        {profilePhotoPreview ? (
                          <AvatarImage src={profilePhotoPreview} alt="Profile" />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                            {user.email?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <input
                        type="file"
                        ref={profilePhotoInputRef}
                        onChange={handleProfilePhotoChange}
                        accept="image/*"
                        className="hidden"
                        data-testid="input-profile-photo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => profilePhotoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        data-testid="button-upload-profile-photo"
                      >
                        {uploadingPhoto && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {!uploadingPhoto && <Upload className="h-4 w-4 mr-2" />}
                        Subir Foto
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Formatos: JPG, PNG, GIF (máx. 5MB)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Logo de Empresa</CardTitle>
                    <CardDescription>Sube el logo de tu empresa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-32 w-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center overflow-hidden bg-muted/50">
                        {companyLogoPreview ? (
                          <img src={companyLogoPreview} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <input
                        type="file"
                        ref={companyLogoInputRef}
                        onChange={handleCompanyLogoChange}
                        accept="image/*"
                        className="hidden"
                        data-testid="input-company-logo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => companyLogoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        data-testid="button-upload-company-logo"
                      >
                        {uploadingLogo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {!uploadingLogo && <Upload className="h-4 w-4 mr-2" />}
                        Subir Logo
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Formatos: JPG, PNG, SVG (máx. 5MB)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Company Information Tab */}
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Datos de Empresa</CardTitle>
                  <CardDescription>Información de contacto de tu empresa</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...companyForm}>
                    <form onSubmit={companyForm.handleSubmit(handleCompanyUpdate)} className="space-y-4" data-testid="form-company">
                      <FormField
                        control={companyForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la Empresa *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Vudy Technologies" {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="companyAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Av. Principal 123, Ciudad" {...field} data-testid="input-company-address" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={companyForm.control}
                          name="companyWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sitio Web</FormLabel>
                              <FormControl>
                                <Input placeholder="https://ejemplo.com" {...field} data-testid="input-company-website" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={companyForm.control}
                          name="companyPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 234 567 8900" {...field} data-testid="input-company-phone" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={companyForm.control}
                        name="companyEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Empresa</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contacto@empresa.com" {...field} data-testid="input-company-email" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-company">
                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Datos de Empresa
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4" data-testid="form-password">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña Actual</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} data-testid="input-current-password" />
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
                            <FormLabel>Nueva Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} data-testid="input-new-password" />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Mínimo 8 caracteres
                            </p>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} data-testid="input-confirm-password" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={changePasswordMutation.isPending} data-testid="button-change-password">
                        {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cambiar Contraseña
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
