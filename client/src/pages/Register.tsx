import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Building2, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const companySchema = z.object({
  name: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  address: z.string().optional(),
  website: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
});

const userSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  username: z.string().min(4, "El nombre de usuario debe tener al menos 4 caracteres").regex(/^[a-zA-Z0-9-]+$/, "Solo letras, números y guiones"),
  email: z.string().email("Debe ser un email válido"),
  country: z.string().length(2, "Debe ser un código de país de 2 letras (ej: SV, GT, US)").toUpperCase(),
});

type CompanyData = z.infer<typeof companySchema>;
type UserData = z.infer<typeof userSchema>;

export default function Register() {
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const companyForm = useForm<CompanyData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      address: "",
      website: "",
      phone: "",
      email: "",
    },
  });

  const userForm = useForm<UserData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      country: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { company: CompanyData; user: UserData }) => {
      return await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Registro exitoso!",
        description: "Te hemos enviado un email con un link para activar tu cuenta. Por favor revisa tu bandeja de entrada.",
      });
      setTimeout(() => navigate("/"), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrarse",
        description: error.message || "Hubo un error al crear tu cuenta. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleCompanySubmit = (data: CompanyData) => {
    setCompanyData(data);
    setStep(2);
  };

  const handleUserSubmit = (data: UserData) => {
    if (!companyData) return;
    registerMutation.mutate({
      company: companyData,
      user: data,
    });
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 to-teal-700 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <img src="https://vudy.app/assets/logo-vudy-DsK_RJCx.svg" alt="Vudy OTC" className="h-8" />
          </div>
          <CardTitle className="text-2xl">
            {step === 1 ? "Registra tu empresa" : "Crea tu cuenta"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Paso 1 de 2: Información de la empresa"
              : "Paso 2 de 2: Información del administrador"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4">
                <div className="flex items-center gap-2 text-teal-600 mb-4">
                  <Building2 className="h-5 w-5" />
                  <span className="font-semibold">Datos de la empresa</span>
                </div>

                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Mi Empresa S.A." {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email corporativo</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@miempresa.com" {...field} data-testid="input-company-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+503 1234 5678" {...field} data-testid="input-company-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: San Salvador, El Salvador" {...field} data-testid="input-company-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio web</FormLabel>
                      <FormControl>
                        <Input placeholder="https://miempresa.com" {...field} data-testid="input-company-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Link href="/">
                    <Button type="button" variant="outline" data-testid="button-back-to-login">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Volver al login
                    </Button>
                  </Link>
                  <Button type="submit" data-testid="button-next-step">
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 text-teal-600 mb-4">
                  <User className="h-5 w-5" />
                  <span className="font-semibold">Datos del administrador</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido *</FormLabel>
                        <FormControl>
                          <Input placeholder="Pérez" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={userForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de usuario *</FormLabel>
                      <FormControl>
                        <Input placeholder="juanperez" {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email personal *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan@email.com" {...field} data-testid="input-user-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País (código ISO) *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="SV" 
                          maxLength={2} 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          data-testid="input-country" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Atrás
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Registrando..." : "Crear cuenta"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {registerMutation.isSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ Revisa tu email para activar tu cuenta
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
