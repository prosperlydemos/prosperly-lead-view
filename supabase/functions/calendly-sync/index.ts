
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const calendlyToken = Deno.env.get('CALENDLY_PERSONAL_TOKEN')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Try to get payload, but don't fail if it's not JSON (for manual sync)
    let payload = null
    let isManualSync = false
    
    try {
      const text = await req.text()
      if (text) {
        payload = JSON.parse(text)
        console.log('Calendly webhook payload:', JSON.stringify(payload, null, 2))
      } else {
        isManualSync = true
        console.log('Manual sync triggered - fetching from Calendly API')
      }
    } catch (e) {
      isManualSync = true
      console.log('No JSON payload found - treating as manual sync')
    }

    // Handle manual sync - fetch from Calendly API
    if (isManualSync) {
      console.log('Fetching scheduled events from Calendly API...')
      
      // First, get the user's URI from Calendly
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user info: ${userResponse.status}`)
      }
      
      const userData = await userResponse.json()
      const userUri = userData.resource.uri
      console.log('Calendly user URI:', userUri)
      
      // Fetch scheduled events from the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const eventsResponse = await fetch(`https://api.calendly.com/scheduled_events?user=${userUri}&min_start_time=${thirtyDaysAgo.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch events: ${eventsResponse.status}`)
      }
      
      const eventsData = await eventsResponse.json()
      console.log(`Found ${eventsData.collection.length} scheduled events`)
      
      const newLeads = []
      
      // Process each scheduled event
      for (const event of eventsData.collection) {
        try {
          // Fetch invitee details for this event
          const inviteesResponse = await fetch(`https://api.calendly.com/scheduled_events/${event.uri.split('/').pop()}/invitees`, {
            headers: {
              'Authorization': `Bearer ${calendlyToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!inviteesResponse.ok) {
            console.log(`Failed to fetch invitees for event ${event.uri}`)
            continue
          }
          
          const inviteesData = await inviteesResponse.json()
          
          for (const invitee of inviteesData.collection) {
            const email = invitee.email
            const name = invitee.name
            const scheduledTime = event.start_time
            
            // Get additional details from questions if available
            let businessName = ''
            if (invitee.questions_and_answers) {
              const businessQuestion = invitee.questions_and_answers.find(
                (qa: any) => qa.question.toLowerCase().includes('business') || qa.question.toLowerCase().includes('company')
              )
              if (businessQuestion) {
                businessName = businessQuestion.answer
              }
            }

            // Get default admin user ID for lead assignment
            const { data: adminUser } = await supabase
              .from('profiles')
              .select('id')
              .eq('is_admin', true)
              .limit(1)
              .single()

            if (!adminUser) {
              console.log('No admin user found to assign lead to')
              continue
            }

            // Check if lead already exists
            const { data: existingLead } = await supabase
              .from('leads')
              .select('id')
              .eq('email', email)
              .single()

            if (!existingLead) {
              // Create new lead with blank lead source
              const { data: newLead, error: insertError } = await supabase
                .from('leads')
                .insert({
                  contact_name: name,
                  email: email,
                  business_name: businessName || null,
                  lead_source: '', // Leave blank by default
                  status: 'Demo Scheduled',
                  demo_date: scheduledTime,
                  owner_id: adminUser.id,
                  value: 0,
                  setup_fee: 0,
                  mrr: 0
                })
                .select()
                .single()

              if (insertError) {
                console.error('Error creating lead:', insertError)
                continue
              }

              console.log('Created new lead from Calendly API:', newLead)
              newLeads.push(newLead)
            } else {
              // Update existing lead with demo date if needed
              const { error: updateError } = await supabase
                .from('leads')
                .update({
                  demo_date: scheduledTime,
                  status: 'Demo Scheduled'
                })
                .eq('id', existingLead.id)

              if (updateError) {
                console.error('Error updating lead:', updateError)
              } else {
                console.log('Updated existing lead from Calendly API:', existingLead.id)
              }
            }
          }
        } catch (eventError) {
          console.error('Error processing event:', eventError)
          continue
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Manual sync completed - processed ${eventsData.collection.length} events, created ${newLeads.length} new leads`,
        newLeads: newLeads
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Handle invitee.created event (when someone books a demo via webhook)
    if (payload && payload.event === 'invitee.created') {
      const invitee = payload.payload
      const event = invitee.event
      
      // Extract lead information
      const email = invitee.email
      const name = invitee.name
      const scheduledTime = invitee.start_time
      
      // Get additional details from questions if available
      let businessName = ''
      if (invitee.questions_and_answers) {
        const businessQuestion = invitee.questions_and_answers.find(
          (qa: any) => qa.question.toLowerCase().includes('business') || qa.question.toLowerCase().includes('company')
        )
        if (businessQuestion) {
          businessName = businessQuestion.answer
        }
      }

      // Get default admin user ID for lead assignment
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true)
        .limit(1)
        .single()

      if (!adminUser) {
        throw new Error('No admin user found to assign lead to')
      }

      // Check if lead already exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .single()

      if (!existingLead) {
        // Create new lead with blank lead source
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            contact_name: name,
            email: email,
            business_name: businessName || null,
            lead_source: '', // Leave blank by default
            status: 'Demo Scheduled',
            demo_date: scheduledTime,
            owner_id: adminUser.id,
            value: 0,
            setup_fee: 0,
            mrr: 0
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating lead:', insertError)
          throw insertError
        }

        console.log('Created new lead from webhook:', newLead)
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Lead created successfully',
          newLeads: [newLead]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        // Update existing lead with demo date
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            demo_date: scheduledTime,
            status: 'Demo Scheduled'
          })
          .eq('id', existingLead.id)

        if (updateError) {
          console.error('Error updating lead:', updateError)
          throw updateError
        }

        console.log('Updated existing lead from webhook:', existingLead.id)
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Lead updated successfully',
          newLeads: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    } else {
      // Unknown request type
      console.log('Unknown request - no webhook data and not a manual sync')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No action taken - unknown request type',
        newLeads: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    console.error('Error processing Calendly sync:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
