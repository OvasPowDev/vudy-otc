const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VUDY_API_BASE = "https://api-stg.vudy.app/v1/auth";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, language } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vudyApiKey = Deno.env.get('VUDY_API_KEY');
    if (!vudyApiKey) {
      console.error('VUDY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`${VUDY_API_BASE}/send-otp`, {
      method: 'POST',
      headers: {
        'x-api-key': vudyApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        language: language || 'en',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vudy API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send OTP', 
          details: errorText,
          debug: {
            vudyError: errorText,
            statusCode: response.status,
            endpoint: `${VUDY_API_BASE}/send-otp`,
            requestBody: { email, language }
          }
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: data.success || false, 
        otpId: data.data?.otpId,
        identifier: data.data?.identifier,
        profiles: data.data?.profiles || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auth-send-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        debug: {
          stack: errorStack,
          type: 'exception'
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
