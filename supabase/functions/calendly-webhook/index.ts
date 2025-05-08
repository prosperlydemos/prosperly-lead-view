import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Cors headers for allowing requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = "https://mfnaopgzaeewhvhhvxbd.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Calendly API constants
const CALENDLY_API_URL = "https://api.calendly.com";
const CALENDLY_TOKEN = Deno.env.get("CALENDLY_PERSONAL_TOKEN") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle different actions
    if (action === "sync") {
      return await syncCalendlyEvents(req);
    } else {
      // Default webhook handler (for backward compatibility)
      return await handleWebhook(req);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Function to handle the original webhook flow (keeping for compatibility)
async function handleWebhook(req: Request) {
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

  // Create a new lead
  return await createLead(name, email, businessName, leadSource, demoDate, nextFollowUp);
}

// New function to sync events from Calendly API
async function syncCalendlyEvents(req: Request) {
  // Check if it's a GET request
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      }
    );
  }

  if (!CALENDLY_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Calendly token not configured" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  console.log("Starting Calendly event sync...");

  try {
    // Get user info to extract the URI
    const userResponse = await fetch(`${CALENDLY_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${CALENDLY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("Error fetching Calendly user:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Calendly user data" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const userData = await userResponse.json();
    console.log("User data:", JSON.stringify(userData));
    
    const userURI = userData.resource.uri;
    
    // Get scheduled events from a date range (last week to future)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const eventsResponse = await fetch(
      `${CALENDLY_API_URL}/scheduled_events?user=${userURI}&min_start_time=${oneWeekAgo.toISOString()}`, 
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("Error fetching Calendly events:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Calendly events" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const eventsData = await eventsResponse.json();
    console.log(`Found ${eventsData.collection.length} events`);

    // Process each event to get invitees
    let newLeadsCount = 0;
    const processedEvents = [];
    
    for (const event of eventsData.collection) {
      // For each event, get the invitees
      const inviteesResponse = await fetch(
        `${CALENDLY_API_URL}/scheduled_events/${event.uri.split('/').pop()}/invitees`,
        {
          headers: {
            'Authorization': `Bearer ${CALENDLY_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!inviteesResponse.ok) {
        console.error(`Error fetching invitees for event ${event.uri}`);
        continue;
      }

      const inviteesData = await inviteesResponse.json();
      
      for (const invitee of inviteesData.collection) {
        // Check if this lead already exists in our database
        const { data: existingLeads } = await supabase
          .from('leads')
          .select('id')
          .eq('email', invitee.email)
          .eq('demo_date', event.start_time);
          
        if (existingLeads && existingLeads.length > 0) {
          console.log(`Lead already exists for ${invitee.email} on ${event.start_time}`);
          continue;
        }

        // Process each invitee - create a lead
        const name = invitee.name || "";
        const email = invitee.email || "";
        const demoDate = event.start_time;
        
        // Set next follow up 2 days after demo
        const demoDateTime = new Date(demoDate);
        const nextFollowUp = new Date(demoDateTime);
        nextFollowUp.setDate(nextFollowUp.getDate() + 2);
        
        // Get the questions and extract data
        let businessName = "";
        let leadSource = "Calendly";
        
        // Try to get questions/responses
        const questionsResponse = await fetch(
          `${CALENDLY_API_URL}/scheduled_events/${event.uri.split('/').pop()}/invitees/${invitee.uri.split('/').pop()}/questions_and_answers`,
          {
            headers: {
              'Authorization': `Bearer ${CALENDLY_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          
          for (const qa of questionsData.collection) {
            if (qa.question.toLowerCase().includes("company") || qa.question.toLowerCase().includes("business")) {
              businessName = qa.answer;
            }
            if (qa.question.toLowerCase().includes("source") || qa.question.toLowerCase().includes("hear")) {
              leadSource = qa.answer;
            }
          }
        }

        // Create lead
        const result = await createLead(name, email, businessName, leadSource, demoDate, nextFollowUp.toISOString());
        const resultJson = await result.json();
        
        if (resultJson.success) {
          newLeadsCount++;
          processedEvents.push({
            name,
            email,
            demoDate,
            lead_id: resultJson.lead?.id
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced Calendly events. Created ${newLeadsCount} new leads.`,
        processed: processedEvents
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in Calendly sync:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

// Helper function to create a lead
async function createLead(name: string, email: string, businessName: string, leadSource: string, demoDate: string, nextFollowUp: string) {
  // Create a new lead in the database
  const { data, error } = await supabase.from("leads").insert([
    {
      contact_name: name,
      email: email,
      business_name: businessName || '',
      lead_source: leadSource || 'Calendly',
      demo_date: demoDate,
      next_follow_up: nextFollowUp,
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
}
