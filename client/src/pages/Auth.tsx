import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  // Bypass login for jose@jose.com
  const handleBypassLogin = async () => {
    setLoading(true);
    try {
      const testEmail = "jose@jose.com";
      
      const { data, error } = await supabase.functions.invoke('auth-dev-bypass', {
        body: { email: testEmail }
      });

      if (error) throw error;

      if (data?.access_token) {
        // Extract token from magic link
        const url = new URL(data.access_token);
        const token = url.searchParams.get('token');
        
        if (token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink'
          });

          if (verifyError) throw verifyError;
          
          toast.success('Login exitoso como Jose');
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error('Bypass login error:', error);
      toast.error(error.message || 'Error en login automático');
    } finally {
      setLoading(false);
    }
  };

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });
  }, [navigate]);

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
      const { data, error } = await supabase.functions.invoke('auth-onboard', {
        body: {
          firstName,
          lastName,
          email,
          country,
          username: generateUsername(email),
        },
      });

      if (error) {
        console.error("❌ Error onboarding user:", error);
        toast.error('No se pudo crear la cuenta');
        return false;
      }

      if (!data || data.error) {
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
      const { data, error } = await supabase.functions.invoke('auth-send-otp', {
        body: {
          email,
          language: language === "es" ? "es" : "en",
        },
      });

      if (error) {
        console.error("❌ Error sending OTP:", error);
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
      // TEMPORARY: Bypass for omar@omar.com - direct access without password
      if (email === 'omar@omar.com') {
        console.warn('⚠️ DEV MODE: Bypass for omar@omar.com - skipping registration/OTP');
        
        // Close all previous sessions
        await supabase.auth.signOut({ scope: 'global' });
        
        // Try to sign in with dev password
        const devPassword = 'vudy-dev-2025';
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: devPassword,
        });

        // If login fails, create the account
        if (signInError) {
          console.log('Account does not exist, creating dev account...');
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password: devPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                dev_account: true
              }
            },
          });

          if (signUpError) {
            console.error('❌ Error creating dev account:', signUpError);
            toast.error(`Error creando cuenta: ${signUpError.message}`);
            setLoading(false);
            return;
          }

          console.log('✅ Dev account created, signing in...');
          
          // Sign in with the newly created account
          const { error: retrySignInError } = await supabase.auth.signInWithPassword({
            email,
            password: devPassword,
          });

          if (retrySignInError) {
            console.error('❌ Error signing in after account creation:', retrySignInError);
            toast.error('Cuenta creada. Intenta de nuevo.');
            setLoading(false);
            return;
          }
        }
        
        console.log('✅ Dev bypass successful - Direct access granted');
        toast.success('Acceso directo habilitado');
        // Navigation will happen automatically via onAuthStateChange
        setLoading(false);
        return;
      }

      // NEW FLOW: Try to send OTP first
      const result = await sendOTP();

      // Check if OTP was sent successfully FIRST
      if (result.success && result.data?.otpId && result.data?.identifier) {
        // User exists and OTP sent successfully
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
      const { data, error } = await supabase.functions.invoke('auth-verify-otp', {
        body: {
          email,
          otp,
          otpId,
          identifier,
          ...(selectedProfileId && { profileId: selectedProfileId })
        },
      });

      if (error) {
        console.error("❌ Error verifying OTP:", error);
        toast.error('Ocurrió un problema al verificar el código');
        setLoading(false);
        return;
      }

      if (!data?.success) {
        console.error("❌ Error verifying OTP:", data);
        
        // Check if user not found
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
      
      // Store the session from Vudy
      if (data?.sessionToken || data?.data?.session) {
        const sessionToken = data.sessionToken || data.data.session;
        localStorage.setItem('platform_session', sessionToken);
        
        // Store additional data if available
        if (data?.data) {
          localStorage.setItem('platform_user_data', JSON.stringify(data.data));
        }
        
        // Create a consistent password for Supabase (short and secure)
        const supabasePassword = `vudy-${email.split('@')[0]}-2025`;
        
        // Try to sign in to Supabase
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: supabasePassword,
        });

        if (signInError) {
          console.log("Creating new Supabase account...");
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password: supabasePassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
            },
          });

          if (signUpError) {
            console.error("❌ Error creating Supabase account:", signUpError);
            toast.error('Error al crear la sesión local');
            setLoading(false);
            return;
          }

          // After signup, sign in
          const { error: retrySignInError } = await supabase.auth.signInWithPassword({
            email,
            password: supabasePassword,
          });

          if (retrySignInError) {
            console.error("❌ Error signing in after signup:", retrySignInError);
            toast.error('Error al iniciar sesión');
            setLoading(false);
            return;
          }
        }

        toast.success('¡Autenticación exitosa!');
        navigate("/");
      } else {
        toast.error('No se recibió sesión válida');
        setLoading(false);
      }
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-background relative">
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
        </div>
        
        <div className="w-full max-w-[400px] space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <img 
              src={isDark ? vudyLogoDark : vudyLogo} 
              alt="VUDY OTC" 
              className="h-12 sm:h-16 object-contain" 
            />
            <h1 className="text-2xl sm:text-[32px] font-bold text-foreground leading-tight">
              {t('auth.signIn')}
            </h1>
          </div>

          {step === "email" && !isNewUser && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[14px] font-medium">
                  {t('auth.emailAddress')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-border bg-background"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-[15px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                disabled={loading}
              >
                {loading ? t('auth.loading') : t('auth.continue')}
              </Button>
            </form>
          )}

          {step === "email" && isNewUser && (
            <form onSubmit={handleNewUserSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[14px] font-medium">
                  {t('auth.emailAddress')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="h-12 border-border bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[14px] font-medium">
                  {t('auth.firstName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 border-border bg-background"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[14px] font-medium">
                  {t('auth.lastName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 border-border bg-background"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[14px] font-medium">
                  {t('auth.country')} <span className="text-destructive">*</span>
                </Label>
                <Select value={country} onValueChange={setCountry} disabled={loading}>
                  <SelectTrigger className="h-12">
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsNewUser(false);
                    setFirstName("");
                    setLastName("");
                    setCountry("");
                  }}
                  className="flex-1 h-12 text-[15px] font-medium rounded-full"
                  disabled={loading}
                >
                  {t('auth.backToEmail')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 text-[15px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  disabled={loading}
                >
                  {loading ? t('auth.loading') : t('auth.continue')}
                </Button>
              </div>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOTPVerification} className="space-y-8">
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {t('auth.enterCode')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('auth.codeDescription')}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-foreground">{email}</span>
                </div>
              </div>

              {profiles.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium">
                    Selecciona tu perfil <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId} disabled={loading}>
                    <SelectTrigger className="h-12">
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

              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={9}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  >
                    <InputOTPGroup className="gap-3">
                      <InputOTPSlot index={0} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={1} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={2} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={3} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={4} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={5} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={6} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={7} className="h-14 w-14 text-lg border-2" />
                      <InputOTPSlot index={8} className="h-14 w-14 text-lg border-2" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="text-center space-y-3">
                  {!canResend && timer > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('auth.resendIn')} <span className="font-medium text-foreground">{timer}</span> {t('auth.seconds')}
                    </p>
                  )}

                  {canResend && (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-sm font-medium text-primary hover:underline transition-colors"
                    >
                      {t('auth.resendCode')}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-12 text-[15px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  disabled={loading || otp.length !== 9}
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
                  }}
                  className="w-full h-12 text-[15px] font-medium"
                  disabled={loading}
                >
                  {t('auth.backToEmail')}
                </Button>
              </div>
            </form>
          )}

          {/* Dev Bypass Button */}
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleBypassLogin}
              className="w-full h-10 text-sm font-medium"
              disabled={loading}
            >
              🔓 Dev: Login as Jose
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden bg-[hsl(var(--hero-dark))]">
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0 opacity-[0.15]" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0'
          }} />
        </div>

        <div className="relative z-10 max-w-lg space-y-8 text-left px-8">
          <h2 className="text-5xl font-bold text-white leading-[1.2]">
            {t('auth.welcomeTitle').split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h2>
          <p className="text-lg text-white/80 leading-relaxed">
            {t('auth.welcomeDescription')}
          </p>
          <div className="flex items-center gap-4 pt-4">
            <OnlineOperators />
            <p className="text-white/80 text-[15px]">
              {t('auth.operatorsOnline')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
