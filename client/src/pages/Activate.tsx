import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Activate() {
  const params = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "retrying">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const activateAccount = async () => {
    if (!params?.token) {
      setStatus("error");
      setErrorMessage("Token de activación no válido");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`/api/auth/activate/${params.token}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Error al activar la cuenta");
        setCanRetry(data.canRetry || false);
        return;
      }

      // Account activated successfully
      setStatus("success");
      setProfile(data.profile);

      // Automatically log in the user
      if (data.profile) {
        login(data.profile);
      }

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Activation error:", error);
      setStatus("error");
      setErrorMessage("Error de conexión. Por favor intenta de nuevo.");
      setCanRetry(true);
    }
  };

  useEffect(() => {
    activateAccount();
  }, [params?.token]);

  const handleRetry = () => {
    setStatus("retrying");
    activateAccount();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 to-teal-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="https://vudy.app/assets/logo-vudy-DsK_RJCx.svg" alt="Vudy OTC" className="h-10" />
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" || status === "retrying" ? "Activando tu cuenta..." : 
             status === "success" ? "¡Cuenta activada!" :
             "Error de activación"}
          </CardTitle>
          <CardDescription>
            {status === "loading" || status === "retrying" ? "Por favor espera mientras procesamos tu activación" :
             status === "success" ? "Tu cuenta ha sido activada exitosamente" :
             "No pudimos activar tu cuenta"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {(status === "loading" || status === "retrying") && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-teal-600" data-testid="loading-spinner" />
                <p className="text-sm text-muted-foreground text-center">
                  {status === "retrying" ? "Reintentando..." : "Validando tu cuenta con Vudy..."}
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="success-icon" />
                <div className="text-center space-y-2">
                  <p className="font-medium text-green-700">
                    ¡Bienvenido{profile?.firstName ? `, ${profile.firstName}` : ""}!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Serás redirigido al dashboard en breve...
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/dashboard")} 
                  className="w-full"
                  data-testid="button-go-dashboard"
                >
                  Ir al Dashboard
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                {canRetry ? (
                  <AlertCircle className="h-16 w-16 text-yellow-500" data-testid="warning-icon" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" data-testid="error-icon" />
                )}
                
                <div className="text-center space-y-2">
                  <p className="font-medium text-red-700">
                    {errorMessage}
                  </p>
                  {canRetry && (
                    <p className="text-sm text-muted-foreground">
                      Hubo un problema al comunicarnos con Vudy. Puedes intentar de nuevo.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  {canRetry && (
                    <Button 
                      onClick={handleRetry} 
                      className="w-full"
                      data-testid="button-retry"
                    >
                      Volver a intentar
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="w-full"
                    data-testid="button-back-login"
                  >
                    Volver al login
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
