import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import vudyLogo from "@/assets/Logo_Vudy_OTC.png";
import vudyLogoDark from "@/assets/Logo_Vudy_OTC_Dark.png";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { OnlineOperators } from "@/components/OnlineOperators";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";

const countries = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user, login } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Email and registration fields
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Step 2: OTP verification
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [profiles, setProfiles] = useState<Array<{id: string, nickname: string, team: string}>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const generateUsername = (email: string) => {
    return email.split('@')[0] + Math.floor(Math.random() * 1000);
  };

  const onboardUser = async () => {
    try {
      const response = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          country,
          username: generateUsername(email),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("❌ Error onboarding user:", data);
        toast.error(data?.error?.message || 'No se pudo crear la cuenta');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("❌ Exception onboarding user:", error);
      toast.error('Error de red al crear la cuenta');
      return false;
    }
  };

  const sendOTP = async () => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          language: language === "es" ? "es" : "en",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Error sending OTP:", data);
        return { success: false, data: null };
      }

      if (data?.success && data?.otpId) {
        setOtpId(data.otpId);
        if (data.identifier) {
          setIdentifier(data.identifier);
        }
        if (data.profiles && data.profiles.length > 0) {
          setProfiles(data.profiles);
          setSelectedProfileId(data.profiles[0].id);
        }
        return { success: true, data };
      }
      
      return { success: false, data };
    } catch (error) {
      console.error("❌ Exception sending OTP:", error);
      return { success: false, data: null };
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(t('auth.errors.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('auth.errors.emailInvalid'));
      return;
    }

    setLoading(true);

    try {
      // TEMPORARY: Bypass for jose@jose.com and omar@omar.com
      if (email === 'jose@jose.com' || email === 'omar@omar.com') {
        console.warn('⚠️ DEV MODE: Bypass for development emails');
        
        const profileResponse = await fetch('/api/profiles/get-or-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            firstName: email.split('@')[0],
            lastName: 'Dev',
          }),
        });
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          login({ email: profile.email, id: profile.id, firstName: profile.firstName, lastName: profile.lastName });
          toast.success('Acceso directo habilitado');
          navigate("/dashboard");
        } else {
          toast.error('Error al crear perfil de desarrollo');
        }
        
        setLoading(false);
        return;
      }

      // Try to send OTP first
      const result = await sendOTP();

      // Check if OTP was sent successfully
      if (result.success && result.data?.otpId && result.data?.identifier) {
        toast.success(t('auth.success.otpSent'));
        setStep("otp");
        setTimer(60);
        setCanResend(false);
        setLoading(false);
        return;
      }

      // If send-otp failed, user needs to register
      if (!result.success) {
        setIsNewUser(true);
        toast.info('No encontramos tu cuenta. Regístrate para continuar.');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('❌ Exception in handleEmailSubmit:', error);
      toast.error(t('auth.errors.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !country) {
      toast.error(t('auth.errors.fieldRequired'));
      return;
    }

    setLoading(true);

    try {
      const onboarded = await onboardUser();
      if (!onboarded) {
        setLoading(false);
        return;
      }

      const result = await sendOTP();
      if (result.success) {
        toast.success(t('auth.success.accountCreated'));
        toast.success('Te enviamos un código para finalizar el acceso');
        setStep("otp");
        setTimer(60);
        setCanResend(false);
      } else {
        toast.error('No se pudo iniciar la verificación por correo');
      }
    } catch (error) {
      toast.error(t('auth.errors.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 9) {
      toast.error(t('auth.errors.otpInvalid'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          otpId,
          identifier,
          ...(selectedProfileId && { profileId: selectedProfileId })
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        console.error("❌ Error verifying OTP:", data);
        
        if (data?.error?.code === 'USER_NOT_FOUND') {
          setIsNewUser(true);
          setStep("email");
          toast.info('No encontramos tu cuenta. Regístrate para continuar.');
          setLoading(false);
          return;
        }
        
        toast.error(data?.error?.message || 'Código inválido o expirado');
        setLoading(false);
        return;
      }
      
      // Login successful - get or create profile
      const profileResponse = await fetch('/api/profiles/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || data.data?.user?.firstName,
          lastName: lastName || data.data?.user?.lastName,
          country,
        }),
      });
      
      if (!profileResponse.ok) {
        toast.error('Error al crear perfil');
        setLoading(false);
        return;
      }
      
      const profile = await profileResponse.json();
      
      // Check if user account is active
      if (profile.status && profile.status === 'pending') {
        toast.error('Tu cuenta está pendiente de activación. Por favor revisa tu email y activa tu cuenta.');
        setLoading(false);
        setStep("email");
        return;
      }
      
      if (profile.status && profile.status === 'inactive') {
        toast.error('Tu cuenta ha sido desactivada. Por favor contacta al soporte.');
        setLoading(false);
        setStep("email");
        return;
      }
      
      login({
        email: profile.email,
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName
      });

      toast.success('¡Autenticación exitosa!');
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Exception during OTP verification:", error);
      toast.error('Ocurrió un problema al verificar el código');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    const result = await sendOTP();
    
    if (result.success) {
      toast.success('Nuevo código enviado');
      setTimer(60);
      setCanResend(false);
      setOtp("");
    } else {
      toast.error('No se pudo reenviar el código');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <ThemeToggle />
          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
        </div>
        
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-card dark:bg-card rounded-2xl shadow-xl border border-border/50 p-8">
            <div className="space-y-2 mb-8">
              <img 
                src={isDark ? vudyLogoDark : vudyLogo} 
                alt="VUDY OTC" 
                className="h-12 object-contain opacity-90" 
              />
              <h1 className="text-3xl font-bold text-foreground">
                {t('auth.signIn')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('auth.welcomeDescription')}
              </p>
            </div>

            {step === "email" && !isNewUser && (
              <form onSubmit={handleEmailSubmit} className="space-y-5" data-testid="form-email-login">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('auth.emailAddress')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-border bg-background"
                    placeholder="tu@correo.com"
                    disabled={loading}
                    data-testid="input-email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                  disabled={loading}
                  data-testid="button-continue"
                >
                  {loading ? t('auth.loading') : t('auth.continue')}
                </Button>

                <div className="border-t border-border my-4"></div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-xl font-medium"
                  data-testid="button-dev-login"
                  onClick={() => {
                    setEmail('jose@jose.com');
                  }}
                >
                  🔧 Dev: Login as Jose
                </Button>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    ¿No tienes una cuenta?{" "}
                    <Link to="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
                      Crear cuenta
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {step === "email" && isNewUser && (
              <form onSubmit={handleNewUserSubmit} className="space-y-4" data-testid="form-register">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('auth.emailAddress')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="h-11 rounded-xl border-border bg-muted"
                    data-testid="input-email-disabled"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('auth.firstName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 rounded-xl border-border bg-background"
                    disabled={loading}
                    data-testid="input-firstname"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('auth.lastName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 rounded-xl border-border bg-background"
                    disabled={loading}
                    data-testid="input-lastname"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('auth.country')} <span className="text-destructive">*</span>
                  </Label>
                  <Select value={country} onValueChange={setCountry} disabled={loading}>
                    <SelectTrigger className="h-11 rounded-xl" data-testid="select-country">
                      <SelectValue placeholder={t('auth.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsNewUser(false);
                      setFirstName("");
                      setLastName("");
                      setCountry("");
                    }}
                    className="flex-1 h-11 text-sm font-medium rounded-xl"
                    disabled={loading}
                    data-testid="button-back"
                  >
                    {t('auth.backToEmail')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    disabled={loading}
                    data-testid="button-register"
                  >
                    {loading ? t('auth.loading') : t('auth.continue')}
                  </Button>
                </div>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleOTPVerification} className="space-y-6" data-testid="form-otp">
                <div className="space-y-3 text-center">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground">
                      {t('auth.enterCode')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('auth.codeDescription')}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium text-foreground" data-testid="text-email">{email}</span>
                  </div>
                </div>

                {profiles.length > 1 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Selecciona tu perfil <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId} disabled={loading}>
                      <SelectTrigger className="h-11 rounded-xl" data-testid="select-profile">
                        <SelectValue placeholder="Selecciona un perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <span className="flex flex-col">
                              <span className="font-medium">{profile.nickname}</span>
                              <span className="text-xs text-muted-foreground">{profile.team}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={9}
                      value={otp}
                      onChange={setOtp}
                      disabled={loading}
                      data-testid="input-otp"
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={3} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={5} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={6} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={7} className="h-12 w-12 text-base border-2 rounded-lg" />
                        <InputOTPSlot index={8} className="h-12 w-12 text-base border-2 rounded-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="text-center space-y-2">
                    {!canResend && timer > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t('auth.resendIn')} {timer}s
                      </p>
                    )}
                    
                    {canResend && (
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-primary hover:text-primary/80"
                        data-testid="button-resend"
                      >
                        {t('auth.resendCode')}
                      </Button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    disabled={loading || otp.length !== 9}
                    data-testid="button-verify"
                  >
                    {loading ? t('auth.loading') : t('auth.verifyCode')}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setOtpId("");
                      setIdentifier("");
                      setProfiles([]);
                      setSelectedProfileId("");
                    }}
                    className="w-full text-sm"
                    disabled={loading}
                    data-testid="button-back-to-email"
                  >
                    {t('auth.backToEmail')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Welcome Panel */}
      <div className="hidden md:flex items-center justify-center bg-primary p-12">
        <div className="max-w-lg text-primary-foreground space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              {t('auth.welcomeTitle')}
            </h2>
            <p className="text-lg text-teal-50 leading-relaxed">
              {t('auth.welcomeDescription')}
            </p>
          </div>

          <div className="pt-8">
            <OnlineOperators />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
