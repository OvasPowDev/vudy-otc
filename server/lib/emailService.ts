// Email service using Resend
// To enable: Add RESEND_API_KEY to your environment secrets

interface SendActivationEmailParams {
  to: string;
  firstName: string;
  activationLink: string;
}

export async function sendActivationEmail({
  to,
  firstName,
  activationLink,
}: SendActivationEmailParams): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  // If no API key is configured, log the activation link and return true
  // This allows testing without Resend
  if (!resendApiKey) {
    console.log("\n========================================");
    console.log("📧 ACTIVATION EMAIL (Resend not configured)");
    console.log("========================================");
    console.log(`To: ${to}`);
    console.log(`Subject: Activa tu cuenta en Vudy OTC`);
    console.log(`\nHola ${firstName},\n`);
    console.log(`¡Gracias por registrarte en Vudy OTC!`);
    console.log(`\nPara activar tu cuenta, haz clic en el siguiente enlace:`);
    console.log(`\n${activationLink}\n`);
    console.log(`Este enlace es válido por 24 horas.`);
    console.log("\n========================================\n");
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Vudy OTC <onboarding@resend.dev>", // Change this to your verified domain
        to: [to],
        subject: "Activa tu cuenta en Vudy OTC",
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Activa tu cuenta</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">¡Bienvenido a Vudy OTC!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px;">Hola <strong>${firstName}</strong>,</p>
              
              <p>¡Gracias por registrarte en Vudy OTC!</p>
              
              <p>Para activar tu cuenta y comenzar a operar, necesitamos verificar tu dirección de correo electrónico.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" 
                   style="background: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Activar mi cuenta
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
              </p>
              <p style="font-size: 12px; color: #6b7280; word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
                ${activationLink}
              </p>
              
              <p style="font-size: 14px; color: #ef4444; margin-top: 20px;">
                ⚠️ Este enlace es válido por <strong>24 horas</strong>.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af;">
                Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
              </p>
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
                © ${new Date().getFullYear()} Vudy OTC. Todos los derechos reservados.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      return false;
    }

    const data = await response.json();
    console.log("✅ Activation email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending activation email:", error);
    return false;
  }
}
