
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Try to get payload, but don't fail if it's not JSON (for manual sync)
    let payload = null
    try {
      const text = await req.text()
      if (text) {
        payload = JSON.parse(text)
        console.log('Calendly webhook payload:', JSON.stringify(payload, null, 2))
      } else {
        console.log('Manual sync triggered - no payload')
      }
    } catch (e) {
      console.log('No JSON payload found - treating as manual sync')
    }

    // Handle invitee.created event (when someone books a demo)
    if (payload && payload.event === 'invitee.created') {
      const invitee = payload.payload
      const event = invitee.event
      
      // Extract lead information
      const email = invitee.email
      const name = invitee.name
      const scheduledTime = invitee.start_time
      
      // Check if demo date is today or in the future (not in the past)
      const demoDate = new Date(scheduledTime)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set to beginning of today
      
      if (demoDate < today) {
        console.log('Demo date is in the past, skipping lead processing:', scheduledTime)
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Demo date is in the past - lead not processed',
          newLeads: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      
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
            lead_source: '', // Leave blank by default instead of 'Calendly'
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

        console.log('Created new lead:', newLead)
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Lead created successfully',
          newLeads: [newLead]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        // Lead already exists - don't update it, just log and return
        console.log('Lead already exists, skipping update:', existingLead.id)
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Lead already exists - no changes made',
          newLeads: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    } else {
      // Manual sync or other request - just return success
      console.log('Manual sync completed - no webhook data to process')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Manual sync completed - no new leads to process',
        newLeads: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    console.error('Error processing Calendly webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
