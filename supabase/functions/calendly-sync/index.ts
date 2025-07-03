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
    
    console.log('=== CALENDLY SYNC STARTED ===')
    
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

    let newLeads = []
    let totalEventsFound = 0
    let totalEventsProcessed = 0
    let totalPastEventsSkipped = 0
    let totalInviteesProcessed = 0
    let totalLeadsCreated = 0
    let totalLeadsSkipped = 0
    let errors = []
    let dateRange = null
    let debugInfo = {}

    // Handle invitee.created event (when someone books a demo)
    if (payload && payload.event === 'invitee.created') {
      console.log('Processing webhook event: invitee.created')
      try {
        const leadData = await processCalendlyInvitee(payload.payload, supabase)
        if (leadData) {
          newLeads.push(leadData)
          totalLeadsCreated++
          console.log(`✅ Lead created from webhook: ${leadData.contact_name}`)
        } else {
          totalLeadsSkipped++
          console.log('⚠️ Lead was skipped from webhook (already exists or missing data)')
        }
      } catch (error) {
        errors.push(`Webhook processing error: ${error.message}`)
        console.error('❌ Error processing webhook:', error)
      }
    } else {
      // Manual sync - fetch current and future scheduled events from Calendly API
      console.log('=== STARTING MANUAL SYNC ===')
      
      if (!calendlyToken) {
        throw new Error('CALENDLY_PERSONAL_TOKEN not configured')
      }

      // Get current user info to get the organization URI
      console.log('Fetching Calendly user info...')
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('User API failed:', userResponse.status, errorText)
        errors.push(`Failed to get user info: ${userResponse.status} - ${errorText}`)
        throw new Error(`Failed to get user info: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      const organizationUri = userData.resource.current_organization
      console.log('Organization URI:', organizationUri)
      console.log('User resource:', JSON.stringify(userData.resource, null, 2))
      
      // Fetch scheduled events - focus on current and future events only
      const now = new Date()
      const startTime = new Date() // Start from now (today)
      const endTime = new Date()
      endTime.setDate(endTime.getDate() + 21) // Look 21 days ahead for future events

      dateRange = {
        from: startTime.toISOString(),
        to: endTime.toISOString(),
        currentTime: now.toISOString()
      }

      console.log(`📅 SYNC DATE RANGE:`)
      console.log(`   From: ${startTime.toISOString()}`)
      console.log(`   To: ${endTime.toISOString()}`)
      console.log(`   Current time: ${now.toISOString()}`)
      console.log(`   Range: Today + 21 days forward`)

      // Try multiple approaches to get events with pagination
      const approaches = [
        {
          name: 'With organization and status active',
          baseUrl: `https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(organizationUri)}&min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}&status=active`
        },
        {
          name: 'With organization, no status filter',
          baseUrl: `https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(organizationUri)}&min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}`
        },
        {
          name: 'Without organization filter',
          baseUrl: `https://api.calendly.com/scheduled_events?min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}`
        }
      ]

      let allEvents = []
      let successfulApproach = null

      for (const approach of approaches) {
        console.log(`=== TRYING APPROACH: ${approach.name} ===`)
        
        try {
          // Fetch all pages for this approach
          const eventsFromApproach = await fetchAllEvents(approach.baseUrl, calendlyToken)
          
          if (eventsFromApproach.length > 0) {
            allEvents = eventsFromApproach
            successfulApproach = approach.name
            totalEventsFound = eventsFromApproach.length
            console.log(`✅ SUCCESS! Found ${totalEventsFound} total events using: ${approach.name}`)
            break
          } else {
            console.log(`⚠️ No events found with approach: ${approach.name}`)
          }
        } catch (error) {
          console.error(`❌ Error with ${approach.name}:`, error)
          errors.push(`API approach "${approach.name}" failed: ${error.message}`)
        }
      }

      console.log(`📊 EVENTS DISCOVERY SUMMARY:`)
      console.log(`   Total events found: ${totalEventsFound}`)
      console.log(`   Successful approach: ${successfulApproach || 'None'}`)

      debugInfo = {
        approaches: approaches.map(a => a.name),
        successfulApproach,
        totalEventsFound,
        totalEventsProcessed,
        totalPastEventsSkipped,
        totalInviteesProcessed,
        totalLeadsCreated,
        totalLeadsSkipped,
        dateRange,
        organizationUri,
        tokenLength: calendlyToken?.length || 0,
        errors
      }

      if (allEvents.length === 0) {
        console.log('❌ NO EVENTS FOUND WITH ANY APPROACH')
        console.log('This could mean:')
        console.log('1. No events are scheduled in the next 21 days')
        console.log('2. The Calendly token doesn\'t have the right permissions')
        console.log('3. The organization URI is incorrect')
        console.log('4. Events exist but are in a different status')
      } else {
        console.log(`🔄 PROCESSING ${totalEventsFound} EVENTS...`)
        
        // Process each event - all should be current or future since we filtered by date range
        for (const event of allEvents) {
          try {
            console.log(`=== PROCESSING EVENT ${totalEventsProcessed + totalPastEventsSkipped + 1}/${totalEventsFound} ===`)
            console.log(`Event URI: ${event.uri}`)
            console.log(`Event start_time: ${event.start_time}`)
            console.log(`Event name: ${event.name}`)
            console.log(`Event status: ${event.status}`)
            
            // Since we're only fetching future events, we should process all of them
            const eventTime = new Date(event.start_time)
            
            if (eventTime < now) {
              console.log(`⏰ SKIPPING PAST EVENT: Event was ${eventTime.toISOString()}, already passed`)
              totalPastEventsSkipped++
              continue
            }
            
            console.log(`✅ PROCESSING FUTURE EVENT: ${eventTime.toISOString()}`)
            totalEventsProcessed++
            
            // Fetch invitee information for each event
            try {
              const inviteeResponse = await fetch(`${event.uri}/invitees`, {
                headers: {
                  'Authorization': `Bearer ${calendlyToken}`,
                  'Content-Type': 'application/json'
                }
              })

              if (inviteeResponse.ok) {
                const inviteeData = await inviteeResponse.json()
                const inviteeCount = inviteeData.collection.length
                console.log(`👥 Found ${inviteeCount} invitees for event`)
                totalInviteesProcessed += inviteeCount
                
                // Process each invitee
                for (const invitee of inviteeData.collection) {
                  try {
                    console.log('=== PROCESSING INVITEE ===')
                    console.log('Invitee name:', invitee.name)
                    console.log('Invitee email:', invitee.email)
                    console.log('Event start time:', event.start_time)
                    
                    const leadData = await processCalendlyInvitee({
                      event: event,
                      ...invitee
                    }, supabase)
                    
                    if (leadData) {
                      console.log(`✅ Lead created successfully: ${leadData.contact_name} (${leadData.id})`)
                      newLeads.push(leadData)
                      totalLeadsCreated++
                    } else {
                      console.log('⚠️ Lead was skipped (already exists or missing data)')
                      totalLeadsSkipped++
                    }
                  } catch (inviteeError) {
                    console.error(`❌ Error processing invitee ${invitee.name}:`, inviteeError)
                    errors.push(`Error processing invitee ${invitee.name}: ${inviteeError.message}`)
                    totalLeadsSkipped++
                  }
                }
              } else {
                const errorText = await inviteeResponse.text()
                console.error(`❌ Failed to fetch invitees for event ${event.uri}: ${inviteeResponse.status} - ${errorText}`)
                errors.push(`Failed to fetch invitees for event: ${inviteeResponse.status} - ${errorText}`)
              }
            } catch (fetchError) {
              console.error(`❌ Error fetching invitees for event ${event.uri}:`, fetchError)
              errors.push(`Error fetching invitees: ${fetchError.message}`)
            }
          } catch (eventError) {
            console.error(`❌ Error processing event ${event.uri}:`, eventError)
            errors.push(`Error processing event: ${eventError.message}`)
            // Continue with other events
          }
        }
        
        // Update debug info with final counts
        debugInfo.totalEventsProcessed = totalEventsProcessed
        debugInfo.totalPastEventsSkipped = totalPastEventsSkipped
        debugInfo.totalInviteesProcessed = totalInviteesProcessed
        debugInfo.totalLeadsCreated = totalLeadsCreated
        debugInfo.totalLeadsSkipped = totalLeadsSkipped
        debugInfo.errors = errors
      }
    }

    // Update last sync time
    try {
      await supabase
        .from('app_settings')
        .upsert({
          key: 'calendly_last_sync',
          value: new Date().toISOString()
        })
      console.log('✅ Updated last sync time')
    } catch (settingsError) {
      console.error('❌ Error updating last sync time:', settingsError)
      errors.push(`Error updating last sync time: ${settingsError.message}`)
      // Don't fail the whole operation for this
    }

    console.log(`=== 📊 FINAL SYNC SUMMARY ===`)
    console.log(`📅 Date range: ${dateRange ? `${dateRange.from} to ${dateRange.to}` : 'Webhook event'}`)
    console.log(`🔍 Events found: ${totalEventsFound}`)
    console.log(`✅ Events processed: ${totalEventsProcessed}`)
    console.log(`⏰ Past events skipped: ${totalPastEventsSkipped}`)
    console.log(`👥 Total invitees processed: ${totalInviteesProcessed}`)
    console.log(`🎯 New leads created: ${totalLeadsCreated}`)
    console.log(`⚠️ Leads skipped: ${totalLeadsSkipped}`)
    console.log(`❌ Errors encountered: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log(`=== ❌ ERROR DETAILS ===`)
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }
    
    const successMessage = `Sync completed - ${totalLeadsCreated} new leads created from ${totalEventsProcessed} future events (${totalPastEventsSkipped} past events skipped, ${totalInviteesProcessed} invitees processed, ${errors.length} errors)`
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: successMessage,
      summary: {
        eventsFound: totalEventsFound,
        eventsProcessed: totalEventsProcessed,
        pastEventsSkipped: totalPastEventsSkipped,
        inviteesProcessed: totalInviteesProcessed,
        leadsCreated: totalLeadsCreated,
        leadsSkipped: totalLeadsSkipped,
        errorsCount: errors.length,
        dateRange: dateRange
      },
      newLeads: newLeads,
      errors: errors,
      debug: debugInfo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('=== ❌ CRITICAL ERROR IN CALENDLY SYNC ===')
    console.error('Error details:', error)
    console.error('Error stack:', error.stack)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// New function to handle pagination and fetch all events
async function fetchAllEvents(baseUrl: string, token: string) {
  const allEvents = []
  let nextPageToken = null
  let pageCount = 0
  
  do {
    pageCount++
    console.log(`--- Fetching page ${pageCount} ---`)
    
    // Build URL with pagination token if available
    let url = baseUrl + '&count=100' // Request max items per page
    if (nextPageToken) {
      url += `&page_token=${nextPageToken}`
    }
    
    console.log('Fetching URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Page ${pageCount} failed:`, response.status, errorText)
      break
    }

    const data = await response.json()
    console.log(`Page ${pageCount}: Found ${data.collection.length} events`)
    
    // Add events from this page
    allEvents.push(...data.collection)
    
    // Check if there's a next page
    nextPageToken = data.pagination?.next_page_token || null
    console.log(`Next page token: ${nextPageToken ? 'exists' : 'none'}`)
    
    // Safety limit to prevent infinite loops
    if (pageCount > 50) {
      console.warn('Reached maximum page limit (50), stopping pagination')
      break
    }
    
  } while (nextPageToken)
  
  console.log(`=== PAGINATION COMPLETE ===`)
  console.log(`Total pages fetched: ${pageCount}`)
  console.log(`Total events collected: ${allEvents.length}`)
  
  return allEvents
}

async function processCalendlyInvitee(invitee: any, supabase: any) {
  console.log('=== PROCESS CALENDLY INVITEE START ===')
  console.log('Full invitee data:', JSON.stringify(invitee, null, 2))

  // Extract lead information
  const email = invitee.email
  const name = invitee.name
  const scheduledTime = invitee.start_time || invitee.event?.start_time
  
  console.log('Extracted data:')
  console.log('- Email:', email)
  console.log('- Name:', name)
  console.log('- Scheduled time:', scheduledTime)
  
  if (!email || !name || !scheduledTime) {
    console.log('❌ Missing required data for lead:', { email, name, scheduledTime })
    return null
  }
  
  // Simplified date check - let's just check if it's a valid date for now
  const demoDate = new Date(scheduledTime)
  console.log('Demo date parsed:', demoDate.toISOString())
  
  if (isNaN(demoDate.getTime())) {
    console.log('❌ Invalid demo date:', scheduledTime)
    return null
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
  console.log('Business name:', businessName)

  // Get default admin user ID for lead assignment
  console.log('Getting admin user...')
  const { data: adminUser, error: adminError } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single()

  if (adminError || !adminUser) {
    console.error('❌ Error getting admin user:', adminError)
    throw new Error('No admin user found to assign lead to')
  }
  console.log('Admin user found:', adminUser.id)

  // Check if lead already exists
  console.log('Checking if lead already exists...')
  const { data: existingLead, error: checkError } = await supabase
    .from('leads')
    .select('id, contact_name, email')
    .eq('email', email)
    .maybeSingle()

  if (checkError) {
    console.error('❌ Error checking for existing lead:', checkError)
    throw checkError
  }

  if (existingLead) {
    console.log('⚠️ Lead already exists:', existingLead)
    return null
  }

  console.log('✅ Lead does not exist, creating new lead...')
  
  // Create new lead
  const leadToInsert = {
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
  }
  
  console.log('Lead data to insert:', JSON.stringify(leadToInsert, null, 2))

  const { data: newLead, error: insertError } = await supabase
    .from('leads')
    .insert(leadToInsert)
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error creating lead:', insertError)
    throw insertError
  }

  console.log('✅ Successfully created new lead:', newLead)
  return newLead
}
