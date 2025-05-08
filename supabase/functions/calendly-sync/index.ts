
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Get Calendly token
const calendlyToken = Deno.env.get('CALENDLY_PERSONAL_TOKEN') || ''

// Specific meeting type to track
const TARGET_MEETING_NAME = "Prosperly Demo - Get More Google Reviews"

interface CalendlyEvent {
  uri: string
  name: string
  status: string
  start_time: string
  end_time: string
  event_type: {
    name: string
    uri: string
  }
  calendar_event?: {
    external_id?: string
  }
  invitees: Array<{
    email: string
    name: string
    status: string
    questions_and_answers?: Array<{
      question: string
      answer: string
    }>
  }>
  scheduled_by?: {
    name?: string
    email?: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the current timestamp
    const currentTime = new Date()
    // Calculate the timestamp from 7 days ago (to ensure we don't miss anything)
    const sevenDaysAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    console.log('Starting Calendly sync...')

    // Get admin user ID (adam@prosperly.com) - we'll assign all leads to this user
    const { data: adminUser, error: adminUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'adam@prosperly.com')
      .single()
    
    if (adminUserError || !adminUser) {
      throw new Error(`Error finding admin user: ${adminUserError?.message || 'User not found'}`)
    }
    
    const adminId = adminUser.id
    console.log(`Found admin user ID: ${adminId}, will assign all leads to this user`)
    
    // Track new leads added in this sync
    const newLeads = []
    
    // Extract user email from the token to use for the API call
    // First, make a request to get the current user's information
    const meResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${calendlyToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!meResponse.ok) {
      throw new Error(`Error fetching Calendly user info: ${meResponse.status} ${await meResponse.text()}`);
    }
    
    const meData = await meResponse.json();
    const currentUserUri = meData.resource.uri;
    
    // Now use this user URI in the scheduled events request
    // Fetch user's scheduled events from Calendly
    const eventsUrl = 'https://api.calendly.com/scheduled_events'
    const params = new URLSearchParams({
      min_start_time: sevenDaysAgo.toISOString(),
      status: 'active',
      count: '100', // Max allowed by API
      user: currentUserUri // Add the user parameter
    })
    
    const eventsFetchUrl = `${eventsUrl}?${params.toString()}`
    console.log(`Fetching events from: ${eventsFetchUrl}`)
    
    const eventsResponse = await fetch(eventsFetchUrl, {
      headers: {
        'Authorization': `Bearer ${calendlyToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!eventsResponse.ok) {
      throw new Error(`Error fetching Calendly events: ${eventsResponse.status} ${await eventsResponse.text()}`)
    }

    const eventsData = await eventsResponse.json()
    const events = eventsData.collection || []
    console.log(`Found ${events.length} events from Calendly`)

    // Process each event
    for (const event of events) {
      const eventUri = event.uri
      console.log(`Processing event: ${event.name}`)
      
      // Check if this is the target meeting type we're interested in
      if (!event.name.includes(TARGET_MEETING_NAME)) {
        console.log(`Skipping event as it's not a target meeting: ${event.name}`)
        continue
      }
      
      // Fetch detailed event information including invitee data
      const eventDetailsResponse = await fetch(`${eventUri}`, {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!eventDetailsResponse.ok) {
        console.error(`Error fetching event details: ${eventDetailsResponse.status}`)
        continue
      }

      const eventDetails = await eventDetailsResponse.json()
      const resource = eventDetails.resource as CalendlyEvent
      
      // Get invitees for this event
      const inviteesResponse = await fetch(`${eventUri}/invitees`, {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!inviteesResponse.ok) {
        console.error(`Error fetching invitees: ${inviteesResponse.status}`)
        continue
      }

      const inviteesData = await inviteesResponse.json()
      const invitees = inviteesData.collection || []
      
      if (invitees.length === 0) {
        console.log(`No invitees found for event ${eventUri}`)
        continue
      }
      
      // For each invitee, create a lead if it doesn't exist yet
      for (const invitee of invitees) {
        // Get invitee details
        const inviteeDetailsResponse = await fetch(invitee.uri, {
          headers: {
            'Authorization': `Bearer ${calendlyToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!inviteeDetailsResponse.ok) {
          console.error(`Error fetching invitee details: ${inviteeDetailsResponse.status}`)
          continue
        }
        
        const inviteeDetails = await inviteeDetailsResponse.json()
        const inviteeResource = inviteeDetails.resource
        
        if (!inviteeResource) {
          console.error('No resource found in invitee details')
          continue
        }
        
        const inviteeEmail = inviteeResource.email
        const inviteeName = inviteeResource.name
        let businessName = ''
        
        // Try to get business name from questions & answers if available
        if (inviteeResource.questions_and_answers && inviteeResource.questions_and_answers.length > 0) {
          for (const qa of inviteeResource.questions_and_answers) {
            if (qa.question.toLowerCase().includes('company') || qa.question.toLowerCase().includes('business')) {
              businessName = qa.answer
              break
            }
          }
        }

        // Check if this lead already exists (by email)
        const { data: existingLeads } = await supabase
          .from('leads')
          .select('id')
          .eq('email', inviteeEmail)
          
        if (existingLeads && existingLeads.length > 0) {
          console.log(`Lead already exists for ${inviteeEmail}, skipping`)
          continue
        }
        
        // Log the start time we're capturing from Calendly
        console.log(`Demo date/time from Calendly: ${resource.start_time}`)
        
        // Create the new lead - assigned to adam@prosperly.com
        const newLead = {
          contact_name: inviteeName,
          email: inviteeEmail,
          business_name: businessName,
          lead_source: 'Calendly',
          setup_fee: 0, // Default value
          mrr: 0, // Default value
          demo_date: resource.start_time, // Store the full ISO date string with time
          status: 'Demo Scheduled',
          owner_id: adminId, // Using the admin ID (adam@prosperly.com)
          value: 0, // Default value
        }
        
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .insert(newLead)
          .select()
          
        if (leadError) {
          console.error(`Error creating lead: ${leadError.message}`)
          continue
        }
        
        console.log(`Successfully created lead for ${inviteeEmail}, assigned to admin (adam@prosperly.com)`)
        newLeads.push(lead)
      }
    }

    // Update the last sync time
    const { error: syncTimeError } = await supabase
      .from('app_settings')
      .upsert({
        key: 'calendly_last_sync',
        value: new Date().toISOString()
      }, { onConflict: 'key' })

    if (syncTimeError) {
      console.error(`Error updating sync time: ${syncTimeError.message}`)
    }

    console.log(`Calendly sync complete. Created ${newLeads.length} new leads.`)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed successfully. Created ${newLeads.length} new leads.`,
        newLeads
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error during Calendly sync:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to sync with Calendly'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
