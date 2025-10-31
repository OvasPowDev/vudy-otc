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
    const { email, firstName, lastName, username, country } = await req.json();
    
    if (!email || !firstName || !lastName || !username || !country) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
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

    const response = await fetch(`${VUDY_API_BASE}/onboard`, {
      method: 'POST',
      headers: {
        'x-api-key': vudyApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        username,
        country,
        isBusiness: false,
        termsOfService: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vudy API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to onboard user', 
          details: errorText,
          debug: {
            vudyError: errorText,
            statusCode: response.status,
            endpoint: `${VUDY_API_BASE}/onboard`,
            requestBody: { email, firstName, lastName, username, country }
          }
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auth-onboard:', error);
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
