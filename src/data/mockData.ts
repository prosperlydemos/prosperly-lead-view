
import { Lead, Note } from '../types';

export const mockLeads: Lead[] = [
  {
    id: '1',
    contactName: 'Emily Johnson',
    email: 'emily@techstartup.com',
    businessName: 'Tech Startup Inc',
    leadSource: 'Referral',
    setupFee: 1000,
    mrr: 350,
    demoDate: '2025-05-10T14:00:00Z',
    signupDate: null,
    status: 'Demo Scheduled',
    ownerId: 'user-1'  // Default owner
  },
  {
    id: '2',
    contactName: 'Michael Rodriguez',
    email: 'michael@growthagency.co',
    businessName: 'Growth Agency',
    leadSource: 'Website',
    setupFee: 1500,
    mrr: 500,
    demoDate: '2025-04-28T10:00:00Z',
    signupDate: null,
    status: 'Warm',
    ownerId: 'user-1'
  },
  {
    id: '3',
    contactName: 'Sarah Thompson',
    email: 'sarah@innovateretail.com',
    businessName: 'Innovate Retail',
    leadSource: 'LinkedIn',
    setupFee: 2000,
    mrr: 750,
    demoDate: '2025-04-25T15:30:00Z',
    signupDate: null,
    status: 'Hot',
    ownerId: 'user-2'
  },
  {
    id: '4',
    contactName: 'David Wilson',
    email: 'david@marketingleaders.org',
    businessName: 'Marketing Leaders',
    leadSource: 'Conference',
    setupFee: 1200,
    mrr: 450,
    demoDate: '2025-04-18T13:00:00Z',
    signupDate: '2025-04-22T09:15:00Z',
    status: 'Closed',
    ownerId: 'user-2'
  },
  {
    id: '5',
    contactName: 'Jessica Brown',
    email: 'jessica@digitaledge.io',
    businessName: 'Digital Edge',
    leadSource: 'Google Ads',
    setupFee: 800,
    mrr: 300,
    demoDate: '2025-05-05T11:00:00Z',
    signupDate: null,
    status: 'Demo Scheduled',
    ownerId: 'user-3'
  }
];

export const mockNotes: Note[] = [
  {
    id: '101',
    leadId: '1',
    content: 'Initial call went well. Emily is interested in our analytics features.',
    createdAt: '2025-05-01T09:15:00Z'
  },
  {
    id: '102',
    leadId: '1',
    content: 'Scheduled demo for next week. Will need to prepare custom slides.',
    createdAt: '2025-05-02T14:30:00Z'
  },
  {
    id: '103',
    leadId: '2',
    content: 'Michael found us through a blog post. His team needs a solution for client reporting.',
    createdAt: '2025-04-20T11:45:00Z'
  },
  {
    id: '104',
    leadId: '2',
    content: 'Demo went well. Following up with pricing details.',
    createdAt: '2025-04-28T15:00:00Z'
  },
  {
    id: '105',
    leadId: '3',
    content: 'Sarah mentioned budget concerns. Prepared special enterprise offer.',
    createdAt: '2025-04-26T10:30:00Z'
  },
  {
    id: '106',
    leadId: '4',
    content: 'Met at SaaS Conference. Very interested in our API capabilities.',
    createdAt: '2025-04-15T09:00:00Z'
  },
  {
    id: '107',
    leadId: '4',
    content: 'Contract signed! Will begin onboarding next week.',
    createdAt: '2025-04-22T14:15:00Z'
  }
];
