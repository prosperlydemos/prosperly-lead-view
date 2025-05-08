
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Cors headers for allowing Calendly to send requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = "https://mfnaopgzaeewhvhhvxbd.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verify this is a POST request
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405,
        }
      );
    }

    // Parse the request body
    const payload = await req.json();
    console.log("Received Calendly webhook:", JSON.stringify(payload));

    // Verify Calendly signature if needed
    // This would require storing the webhook signing key as a secret
    // and implementing HMAC verification

    // Extract data from the payload based on Calendly's schema
    const event = payload.event || {};
    const invitee = payload.payload?.invitee || {};
    const eventData = payload.payload?.event_data || {};
    
    // Get invitee details
    const name = invitee.name || "";
    const email = invitee.email || "";
    
    // Get booking date/time
    const demoDate = eventData.start_time || new Date().toISOString();
    
    // Default next follow up date to 2 days after demo
    const demoDateTime = new Date(demoDate);
    const nextFollowUp = new Date(demoDateTime);
    nextFollowUp.setDate(nextFollowUp.getDate() + 2);
    
    // Get any questions/responses from the form if available
    const questions_and_answers = payload.payload?.questions_and_answers || [];
    let businessName = "";
    let leadSource = "Calendly";
    
    // Try to extract business name and other relevant info from Q&A
    questions_and_answers.forEach((qa: any) => {
      if (qa.question.toLowerCase().includes("company") || qa.question.toLowerCase().includes("business")) {
        businessName = qa.answer;
      }
      if (qa.question.toLowerCase().includes("source") || qa.question.toLowerCase().includes("hear")) {
        leadSource = qa.answer;
      }
    });

    // Create a new lead in the database
    const { data, error } = await supabase.from("leads").insert([
      {
        contact_name: name,
        email: email,
        business_name: businessName,
        lead_source: leadSource,
        demo_date: demoDate,
        next_follow_up: nextFollowUp.toISOString(),
        status: "Demo Scheduled",
        // Get a default owner_id (first admin user)
        owner_id: "7b6c9399-787f-4b03-9ff8-7c0e9068cf07", // Default to Adam White's ID
        value: 0, // Set default value
        mrr: 0,   // Set default MRR
        setup_fee: 0 // Set default setup fee
      },
    ]).select();

    if (error) {
      console.error("Error inserting lead:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead created successfully",
        lead: data[0]
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
