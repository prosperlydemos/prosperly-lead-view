
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

    // Get all active users with email addresses
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .not('email', 'is', null)

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      throw new Error('No users found with email addresses')
    }

    console.log(`Found ${users.length} users with email addresses`)
    
    // Create a map of emails to user IDs for quick lookup
    const emailToUserIdMap = new Map()
    users.forEach(user => {
      if (user.email) {
        emailToUserIdMap.set(user.email.toLowerCase(), user.id)
      }
    })

    // Track new leads added in this sync
    const newLeads = []
    
    // Fetch user's scheduled events from Calendly
    const eventsUrl = 'https://api.calendly.com/scheduled_events'
    const params = new URLSearchParams({
      min_start_time: sevenDaysAgo.toISOString(),
      status: 'active',
      count: '100' // Max allowed by API
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

        // Determine the owner of this lead based on the calendar owner
        let ownerId = null
        if (resource.scheduled_by && resource.scheduled_by.email) {
          const schedulerEmail = resource.scheduled_by.email.toLowerCase()
          ownerId = emailToUserIdMap.get(schedulerEmail)
          
          if (!ownerId) {
            console.log(`No matching user found for scheduler email: ${schedulerEmail}`)
            // If no matching user, assign to first admin user
            const { data: adminUser } = await supabase
              .from('profiles')
              .select('id')
              .eq('is_admin', true)
              .limit(1)
              .single()
              
            if (adminUser) {
              ownerId = adminUser.id
            }
          }
        }
        
        if (!ownerId) {
          console.log('No owner ID could be determined, skipping lead creation')
          continue
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
        
        // Create the new lead
        const newLead = {
          contact_name: inviteeName,
          email: inviteeEmail,
          business_name: businessName,
          lead_source: 'Calendly',
          setup_fee: 0, // Default value
          mrr: 0, // Default value
          demo_date: resource.start_time,
          status: 'Demo Scheduled',
          owner_id: ownerId,
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
        
        console.log(`Successfully created lead for ${inviteeEmail}`)
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
