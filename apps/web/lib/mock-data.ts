import {
  EventCategory,
  EventPublic,
  EventStatus,
  EventType,
  EventStage,
  EventFaq,
  UserPublic,
  UserRole,
  NewsCategory,
  NewsStatus,
  NewsArticle,
} from '@hackers-unity/shared-types';

export interface ExtendedEvent extends EventPublic {
  name?: string;
  tags: string[];
  bannerGradient: string;
  organizerName: string;
  organizerAvatar: string;
  organizerLogo?: string;
  totalPrizeValue: number;
  prize?: string;
  prizeAmount?: number | string;
  participantsCount: number;
  participantsDisplay?: string;
  registrationCount?: number;
  featured?: boolean;
  mode?: string;
  domain?: string;
  teamSize?: string;
  registrationLink?: string;
  ctaText?: string;
  image?: string;
  stages: EventStage[];
  faqs: EventFaq[];
  tracks: { title: string; prize: string; description: string }[];
  sponsors: { name: string; tier: string; logoText: string }[];
}

export interface ExtendedHacker extends UserPublic {
  title: string;
  rating: number;
  hackathonsWon: number;
  openForTeams: boolean;
  interests: string[];
}

export const MOCK_EVENTS: ExtendedEvent[] = [
  {
    id: 'codewars',
    organizerId: 'org_hackers_unity',
    organizerName: "Hacker's Unity",
    organizerAvatar: '⚔️',
    organizerLogo: '',
    name: 'CodeWars Hackathon',
    title: 'CodeWars Hackathon',
    slug: 'codewars',
    description:
      "Get ready to build, innovate, and compete at a National-Level 24-Hour Hackathon powered by Hacker's Unity. Whether you are into AI/ML, Web Development, Blockchain, IoT, or Cybersecurity — bring your idea, build it, and ship it!",
    category: EventCategory.HACKATHON,
    eventType: EventType.OFFLINE,
    mode: 'In-Person',
    domain: 'AI/ML, Web Dev, Blockchain, IoT',
    startDate: '2026-08-22T00:00:00Z',
    endDate: '2026-08-23T23:59:59Z',
    registrationDeadline: '2026-08-22T23:59:59Z',
    eligibilityRules: {
      teamSize: '2-4 Members',
      eligibility: 'Open to college students & independent builders across India',
    },
    prizes: [
      { position: '🥇 Grand Winner', amount: 30000, description: 'Cash prize + Trophy + Certifications + Direct Venture Support' },
      { position: '🥈 1st Runner Up', amount: 15000, description: 'Cash prize + Swag Kits + Fast-track Interviews' },
      { position: '🥉 2nd Runner Up', amount: 5000, description: 'Cash prize + Goodies & Swag Kit' },
    ],
    totalPrizeValue: 50000,
    prize: '₹50,000',
    prizeAmount: 50000,
    bannerUrl: '/gallery/codewars.png',
    image: '/gallery/codewars.png',
    rulesDocUrl: '#',
    registrationLink: '#',
    status: EventStatus.COMPLETED,
    maxParticipants: 1000,
    minTeamSize: 2,
    maxTeamSize: 4,
    teamSize: '2-4',
    isTeamEvent: true,
    location: 'Jaipur, Rajasthan',
    createdAt: '2026-08-01T00:00:00Z',
    participantsCount: 500,
    participantsDisplay: '500+',
    featured: true,
    ctaText: 'Learn More',
    tags: ['AI/ML', 'Blockchain', 'Web3', 'IoT', 'FinTech', 'Open Innovation'],
    bannerGradient: 'from-amber-900/60 via-orange-950/80 to-black',
    tracks: [
      { title: 'AI/ML & Intelligent Systems', prize: '₹20,000 Pool', description: 'Autonomous agents, computer vision, NLP applications.' },
      { title: 'Web3 & Decentralized Protocols', prize: '₹15,000 Pool', description: 'Smart contracts, DeFi, cross-chain applications.' },
      { title: 'IoT & Hardware Automation', prize: '₹15,000 Pool', description: 'Smart embedded devices, sensors, industrial automation.' },
    ],
    stages: [
      { id: 'stg_1', eventId: 'codewars', stageName: 'Registration & Verification', stageOrder: 1, startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-22T23:59:59Z', description: 'Form teams and submit your registration details.' },
      { id: 'stg_2', eventId: 'codewars', stageName: '24-Hour Offline Hackathon', stageOrder: 2, startDate: '2026-08-22T09:00:00Z', endDate: '2026-08-23T09:00:00Z', description: 'Non-stop hacking, mentoring rounds, and milestone checkpoints.' },
      { id: 'stg_3', eventId: 'codewars', stageName: 'Final Pitch & Grand Awards', stageOrder: 3, startDate: '2026-08-23T10:00:00Z', endDate: '2026-08-23T14:00:00Z', description: 'Live demos in front of industry judges and prize distribution.' },
    ],
    faqs: [
      { id: 'faq_1', eventId: 'codewars', question: 'What is the team size?', answer: 'Teams can have between 2 to 4 members.', createdAt: '2026-08-01T00:00:00Z' },
      { id: 'faq_2', eventId: 'codewars', question: 'Is it an offline or online event?', answer: 'CodeWars is an in-person, 24-hour hackathon.', createdAt: '2026-08-01T00:00:00Z' },
    ],
    sponsors: [
      { name: "Hacker's Unity", tier: 'Title Partner', logoText: 'HU' },
    ],
  },
  {
    id: 'clash-of-coders',
    organizerId: 'org_hackers_unity',
    organizerName: "Hacker's Unity",
    organizerAvatar: '⚡',
    organizerLogo: '',
    name: 'Clash Of Coders',
    title: 'Clash Of Coders',
    slug: 'clash-of-coders',
    description:
      'Join Hacker’s Unity for an electrifying 24-hour hackathon where your creativity, coding skills, and problem-solving abilities will be pushed to the next level. 💻⚡',
    category: EventCategory.HACKATHON,
    eventType: EventType.OFFLINE,
    mode: 'Offline',
    domain: 'Blockchain , Web3',
    startDate: '2026-08-23T00:00:00Z',
    endDate: '2026-08-24T23:59:59Z',
    registrationDeadline: '2026-08-03T23:59:59Z',
    eligibilityRules: {
      teamSize: '1-3 Members',
      eligibility: 'Developers, Web3 builders, and university coders',
    },
    prizes: [
      { position: '🥇 Top Winners Pool', amount: 2100, description: '$2100 USD Prize Pool + Exclusive Swag & Goodies Kit' },
    ],
    totalPrizeValue: 2100,
    prize: '$2100 + Swags',
    prizeAmount: '',
    bannerUrl: '/gallery/clash-of-coders.jpeg',
    image: '/gallery/clash-of-coders.jpeg',
    rulesDocUrl: 'https://shorturl.at/91An3',
    registrationLink: 'https://shorturl.at/91An3',
    status: EventStatus.PUBLISHED,
    maxParticipants: 800,
    minTeamSize: 1,
    maxTeamSize: 3,
    teamSize: '1-3',
    isTeamEvent: true,
    location: 'Offline Arena / Hub',
    createdAt: '2026-07-15T00:00:00Z',
    participantsCount: 500,
    participantsDisplay: '500+',
    featured: true,
    ctaText: 'Learn More',
    tags: ['Blockchain', 'Web3', 'Innovation'],
    bannerGradient: 'from-blue-900/60 via-indigo-950/80 to-black',
    tracks: [
      { title: 'DeFi & Payment Systems', prize: '$1,000 Pool', description: 'Decentralized liquidity, payment rails, on-chain analytics.' },
      { title: 'dApps & User Onboarding', prize: '$1,100 Pool', description: 'Web3 UX primitives, account abstraction, consumer applications.' },
    ],
    stages: [
      { id: 'stg_coc_1', eventId: 'clash-of-coders', stageName: 'Registration', stageOrder: 1, startDate: '2026-07-15T00:00:00Z', endDate: '2026-08-03T23:59:59Z', description: 'Register on the portal and form squads.' },
      { id: 'stg_coc_2', eventId: 'clash-of-coders', stageName: 'Hackathon Day', stageOrder: 2, startDate: '2026-08-23T09:00:00Z', endDate: '2026-08-24T09:00:00Z', description: '24-Hour offline coding showdown.' },
    ],
    faqs: [
      { id: 'faq_coc_1', eventId: 'clash-of-coders', question: 'Can I participate solo?', answer: 'Yes, individual participants as well as teams up to 3 are welcome.', createdAt: '2026-07-15T00:00:00Z' },
    ],
    sponsors: [{ name: "Hacker's Unity", tier: 'Organizer', logoText: 'HU' }],
  },
  {
    id: 'chatgpt-codex',
    organizerId: 'org_hu_blockseblock',
    organizerName: "Hacker's Unity X BlockseBlock",
    organizerAvatar: '🤖',
    organizerLogo: '',
    name: 'Chatgpt Codex Hackathon',
    title: 'Chatgpt Codex Hackathon',
    slug: 'chatgpt-codex',
    description:
      "Build real-world AI applications using ChatGPT Codex, collaborate with mentors, showcase your innovation, and compete with some of India's brightest AI builders.",
    category: EventCategory.HACKATHON,
    eventType: EventType.ONLINE,
    mode: 'Online',
    domain: 'Artificial Intelligence',
    startDate: '2026-07-23T00:00:00Z',
    endDate: '2026-08-03T23:59:59Z',
    registrationDeadline: '2026-08-03T23:59:59Z',
    eligibilityRules: {
      teamSize: 'Individual',
      eligibility: 'Open worldwide to AI developers and prompt engineers',
    },
    prizes: [
      { position: '🥇 Top Performer', amount: null, description: 'Codex Pro Access for 1 Year + Mentorship & Ecosystem Grants' },
    ],
    totalPrizeValue: 12000,
    prize: 'Codex Pro access for 1 year',
    prizeAmount: '',
    bannerUrl: '/gallery/openai-hackathon.jpeg',
    image: '/gallery/openai-hackathon.jpeg',
    rulesDocUrl: 'https://linkly.link/2nEHd',
    registrationLink: 'https://linkly.link/2nEHd',
    status: EventStatus.COMPLETED,
    maxParticipants: 1000,
    minTeamSize: 1,
    maxTeamSize: 1,
    teamSize: 'Individual',
    isTeamEvent: false,
    location: 'Online / Virtual',
    createdAt: '2026-07-01T00:00:00Z',
    participantsCount: 500,
    participantsDisplay: '500+',
    featured: true,
    ctaText: 'Learn More',
    tags: ['OpenAI', 'CodexHackathon2026', 'Codex', 'Innovation'],
    bannerGradient: 'from-emerald-950/60 via-teal-950/80 to-black',
    tracks: [
      { title: 'Generative Coding Agents', prize: 'Codex Pro Licenses', description: 'Autonomous tools leveraging OpenAI Codex architectures.' },
    ],
    stages: [
      { id: 'stg_cgc_1', eventId: 'chatgpt-codex', stageName: 'Submissions Closed', stageOrder: 1, startDate: '2026-07-23T00:00:00Z', endDate: '2026-08-03T23:59:59Z', description: 'Challenge ended successfully.' },
    ],
    faqs: [
      { id: 'faq_cgc_1', eventId: 'chatgpt-codex', question: 'Is this event completed?', answer: 'Yes, this hackathon has concluded successfully.', createdAt: '2026-07-01T00:00:00Z' },
    ],
    sponsors: [
      { name: "Hacker's Unity", tier: 'Organizer', logoText: 'HU' },
      { name: 'BlockseBlock', tier: 'Co-Organizer', logoText: 'BSB' },
    ],
  },
  {
    id: 'kestra-orchestration',
    organizerId: 'org_wemakedevs',
    organizerName: 'WeMakeDevs',
    organizerAvatar: '⚙️',
    organizerLogo: '',
    name: 'Kestra Orchestration Challenge',
    title: 'Kestra Orchestration Challenge',
    slug: 'kestra-orchestration',
    description:
      "Hacker's Unity is proud to be a community partner for The Kestra Orchestration Challenge by WeMakeDevs, powered by Kestra. Learn workflow orchestration, get your certificate, and win Apple MacBook, iPad, iPhone, and more worth $4,000.",
    category: EventCategory.HACKATHON,
    eventType: EventType.ONLINE,
    mode: 'Online',
    domain: 'Open Source',
    startDate: '2026-05-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    registrationDeadline: '2026-06-30T23:59:59Z',
    eligibilityRules: {
      teamSize: 'Individual',
      eligibility: 'Open to DevOps engineers, software developers, and cloud enthusiasts',
    },
    prizes: [
      { position: '🥇 Top Tier Rewards', amount: 4000, description: 'Apple MacBook, iPad, iPhone + Kestra Goodies worth $4,000 USD' },
    ],
    totalPrizeValue: 4000,
    prize: '$4,000',
    prizeAmount: 4000,
    bannerUrl: '/gallery/Event_Orchestration.png',
    image: '/gallery/Event_Orchestration.png',
    rulesDocUrl: 'https://www.wemakedevs.org/orchestration',
    registrationLink: 'https://www.wemakedevs.org/orchestration',
    status: EventStatus.COMPLETED,
    maxParticipants: 2000,
    minTeamSize: 1,
    maxTeamSize: 1,
    teamSize: 'Individual',
    isTeamEvent: false,
    location: 'Online / WeMakeDevs Community',
    createdAt: '2026-04-20T00:00:00Z',
    participantsCount: 1000,
    participantsDisplay: '1,000+',
    featured: true,
    ctaText: 'Learn More',
    tags: ['Open Source', 'DevOps', 'Workflow Automation'],
    bannerGradient: 'from-purple-950/60 via-slate-900/80 to-black',
    tracks: [
      { title: 'Workflow Orchestration with Kestra', prize: '$4,000 Pool', description: 'Declarative YAML data orchestration workflows.' },
    ],
    stages: [
      { id: 'stg_koc_1', eventId: 'kestra-orchestration', stageName: 'Challenge Completed', stageOrder: 1, startDate: '2026-05-01T00:00:00Z', endDate: '2026-06-30T23:59:59Z', description: 'Event completed with 1000+ participating builders.' },
    ],
    faqs: [
      { id: 'faq_koc_1', eventId: 'kestra-orchestration', question: 'What was the community role of Hacker’s Unity?', answer: 'Hacker’s Unity was the official community partner.', createdAt: '2026-04-20T00:00:00Z' },
    ],
    sponsors: [
      { name: 'WeMakeDevs', tier: 'Host', logoText: 'WMD' },
      { name: 'Kestra', tier: 'Powered By', logoText: 'KESTRA' },
    ],
  },
  {
    id: 'hackvision-2026',
    organizerId: 'org_hackers_unity',
    organizerName: "Hacker's Unity",
    organizerAvatar: '🔮',
    organizerLogo: '',
    name: 'Hackvision',
    title: 'Hackvision',
    slug: 'hackvision-2026',
    description:
      "Hacker's Unity proudly presents HackVision, a premier hackathon where innovators, developers, and problem-solvers come together to build solutions that matter.",
    category: EventCategory.HACKATHON,
    eventType: EventType.ONLINE,
    mode: 'Online',
    domain: 'Open Ended',
    startDate: '2026-03-28T00:00:00Z',
    endDate: '2026-04-05T23:59:59Z',
    registrationDeadline: '2026-04-05T23:59:59Z',
    eligibilityRules: {
      teamSize: '1-3 Members',
      eligibility: 'Open to all innovators & developers',
    },
    prizes: [
      { position: '🥇 Grand Prize Pool', amount: 100000, description: '₹1,00,000 INR Cash Prize Pool + Devpost Global Hall of Fame' },
    ],
    totalPrizeValue: 100000,
    prize: '₹1,00,000',
    prizeAmount: 100000,
    bannerUrl: '/gallery/Hackvision.jpeg',
    image: '/gallery/Hackvision.jpeg',
    rulesDocUrl: 'https://hackvision.devpost.com',
    registrationLink: 'https://hackvision.devpost.com',
    status: EventStatus.COMPLETED,
    maxParticipants: 3000,
    minTeamSize: 1,
    maxTeamSize: 3,
    teamSize: '1-3',
    isTeamEvent: true,
    location: 'Devpost / Virtual',
    createdAt: '2026-03-01T00:00:00Z',
    participantsCount: 1500,
    participantsDisplay: '1,500+',
    featured: true,
    ctaText: 'Learn More',
    tags: ['Innovation', 'Development', 'Open Ended'],
    bannerGradient: 'from-violet-950/60 via-slate-900/80 to-black',
    tracks: [
      { title: 'Open Innovation & Social Good', prize: '₹1,00,000 Pool', description: 'Solve meaningful real-world challenges across healthcare, education, sustainability.' },
    ],
    stages: [
      { id: 'stg_hv_1', eventId: 'hackvision-2026', stageName: 'Archived / Completed', stageOrder: 1, startDate: '2026-03-28T00:00:00Z', endDate: '2026-04-05T23:59:59Z', description: 'Successfully completed on Devpost.' },
    ],
    faqs: [
      { id: 'faq_hv_1', eventId: 'hackvision-2026', question: 'Where can I see past submissions?', answer: 'All project submissions are published on Devpost.', createdAt: '2026-03-01T00:00:00Z' },
    ],
    sponsors: [{ name: "Hacker's Unity", tier: 'Host', logoText: 'HU' }],
  },
  {
    id: 'hackstorm-2025',
    organizerId: 'org_hackers_unity',
    organizerName: "Hacker's Unity",
    organizerAvatar: '⚡',
    organizerLogo: '',
    name: 'HACKSTORM - Code the Storm',
    title: 'HACKSTORM - Code the Storm',
    slug: 'hackstorm-2025',
    description:
      "Join Hacker's Unity for an electrifying 24-hour hackathon where your creativity, coding skills, and problem-solving abilities are put to the ultimate test.",
    category: EventCategory.HACKATHON,
    eventType: EventType.OFFLINE,
    mode: 'In-Person',
    domain: 'AI/ML, Web3, OpenEnded',
    startDate: '2025-10-31T00:00:00Z',
    endDate: '2025-11-01T23:59:59Z',
    registrationDeadline: '2025-11-01T23:59:59Z',
    eligibilityRules: {
      teamSize: '2-6 Members',
      eligibility: 'Student builders and engineering enthusiasts',
    },
    prizes: [
      { position: '🥇 Grand Champions Pool', amount: 200000, description: '₹2,00,000 INR Cash Prize Pool + Devfolio Badges & Swag' },
    ],
    totalPrizeValue: 200000,
    prize: '₹2,00,000',
    prizeAmount: 200000,
    bannerUrl: '/gallery/Hackstorm.jpeg',
    image: '/gallery/Hackstorm.jpeg',
    rulesDocUrl: 'https://hackstrom-1.devfolio.co',
    registrationLink: 'https://hackstrom-1.devfolio.co',
    status: EventStatus.COMPLETED,
    maxParticipants: 1500,
    minTeamSize: 2,
    maxTeamSize: 6,
    teamSize: '2-6',
    isTeamEvent: true,
    location: 'In-Person Arena',
    createdAt: '2025-09-01T00:00:00Z',
    participantsCount: 800,
    participantsDisplay: '800+',
    featured: true,
    ctaText: 'Learn More',
    tags: ['AI', 'Agents & Automation', 'Web3/Blockchain'],
    bannerGradient: 'from-amber-950/60 via-yellow-950/80 to-black',
    tracks: [
      { title: 'Autonomous Intelligence & Web3', prize: '₹2,00,000 Pool', description: 'Next-gen distributed tools and intelligent applications.' },
    ],
    stages: [
      { id: 'stg_hs_1', eventId: 'hackstorm-2025', stageName: 'Finished', stageOrder: 1, startDate: '2025-10-31T00:00:00Z', endDate: '2025-11-01T23:59:59Z', description: 'Successfully wrapped up on Devfolio.' },
    ],
    faqs: [
      { id: 'faq_hs_1', eventId: 'hackstorm-2025', question: 'Where was Hackstorm hosted?', answer: 'It was hosted on Devfolio with live in-person hacking.', createdAt: '2025-09-01T00:00:00Z' },
    ],
    sponsors: [{ name: "Hacker's Unity", tier: 'Organizer', logoText: 'HU' }],
  },
  {
    id: 'wchl-2025',
    organizerId: 'org_icp_hubs',
    organizerName: 'ICP HUBS Network',
    organizerAvatar: '🌐',
    organizerLogo: '',
    name: 'WCHL 2025 - World Computer Hacker League',
    title: 'WCHL 2025 - World Computer Hacker League',
    slug: 'wchl-2025',
    description:
      'The World Computer Hacker League (WCHL) 2025 is a global hackathon led by the ICP HUBS Network.',
    category: EventCategory.HACKATHON,
    eventType: EventType.ONLINE,
    mode: 'Online',
    domain: 'Web3',
    startDate: '2025-07-01T00:00:00Z',
    endDate: '2025-07-25T23:59:59Z',
    registrationDeadline: '2025-07-25T23:59:59Z',
    eligibilityRules: {
      teamSize: 'Global / Solo or Squads',
      eligibility: 'Developers globally building on Internet Computer Protocol',
    },
    prizes: [
      { position: '🏆 Global ICP Ecosystem Pool', amount: 300000, description: '$300,000+ USD in Grants, Seed Bounties, and ICP Tokens' },
    ],
    totalPrizeValue: 300000,
    prize: '$300K+',
    prizeAmount: 300000,
    bannerUrl: '/gallery/WCHL.jpeg',
    image: '/gallery/WCHL.jpeg',
    rulesDocUrl: 'https://unstop.com/hackathons/world-computer-hacker-league-blockseblock-1508937',
    registrationLink: 'https://unstop.com/hackathons/world-computer-hacker-league-blockseblock-1508937',
    status: EventStatus.COMPLETED,
    maxParticipants: 5000,
    minTeamSize: 1,
    maxTeamSize: 5,
    teamSize: 'Global',
    isTeamEvent: true,
    location: 'Unstop / Global Virtual',
    createdAt: '2025-06-01T00:00:00Z',
    participantsCount: 2000,
    participantsDisplay: '2,000+',
    featured: true,
    ctaText: 'Learn More',
    tags: ['Web3', 'Blockchain', 'ICP'],
    bannerGradient: 'from-sky-950/60 via-blue-950/80 to-black',
    tracks: [
      { title: 'Decentralized Cloud & ICP Canisters', prize: '$300K+ Pool', description: 'Next-gen decentralized computation on the ICP world computer.' },
    ],
    stages: [
      { id: 'stg_wchl_1', eventId: 'wchl-2025', stageName: 'Finished', stageOrder: 1, startDate: '2025-07-01T00:00:00Z', endDate: '2025-07-25T23:59:59Z', description: 'Global event completed on Unstop.' },
    ],
    faqs: [
      { id: 'faq_wchl_1', eventId: 'wchl-2025', question: 'What was the prize pool?', answer: 'Over $300,000+ in prizes and development grants.', createdAt: '2025-06-01T00:00:00Z' },
    ],
    sponsors: [
      { name: 'ICP HUBS Network', tier: 'Lead Organizer', logoText: 'ICP' },
      { name: "Hacker's Unity", tier: 'Community Partner', logoText: 'HU' },
    ],
  },
];

// Helper functions
export const hackathons = MOCK_EVENTS;
export const hackathonFilters = ['All', 'Online', 'In-Person', 'AI/ML', 'Web3', 'Open Source'];

export function getHackathonById(id: string) {
  return hackathons.find((h) => h.id === id || h.slug === id);
}

export function getFeaturedHackathons() {
  return hackathons.filter((h) => h.featured);
}

export function getHackathonsByStatus(status: string) {
  if (status === 'All') return hackathons;
  return hackathons.filter((h) => h.status === status);
}

export const MOCK_HACKERS: ExtendedHacker[] = [
  {
    id: 'hkr_1',
    name: 'Aarav Sharma',
    email: 'aarav@hackersunity.dev',
    role: UserRole.PARTICIPANT,
    phone: '+91 98765 43210',
    college: 'IIT Delhi',
    organization: 'NeuralForge Labs',
    graduationYear: 2026,
    bio: 'Multi-agent researcher & fullstack engineer. 4x national hackathon winner specializing in autonomous workflows.',
    avatarUrl: '👨‍💻',
    skills: ['PyTorch', 'Next.js 16', 'FastAPI', 'PostgreSQL', 'LangGraph'],
    resumeUrl: null,
    socialLinks: { github: 'https://github.com', linkedin: 'https://linkedin.com' },
    emailVerified: true,
    createdAt: '2026-01-10T00:00:00Z',
    title: 'Lead AI Systems Architect',
    rating: 2840,
    hackathonsWon: 4,
    openForTeams: true,
    interests: ['Autonomous Agents', 'Distributed Inference', 'Robotics'],
  },
  {
    id: 'hkr_2',
    name: 'Elena Rostova',
    email: 'elena@hackersunity.dev',
    phone: '+41 78 123 4567',
    role: UserRole.PARTICIPANT,
    college: 'ETH Zurich',
    organization: 'ZeroKnowledge Guild',
    graduationYear: 2025,
    bio: 'ZK-SNARKs researcher, Rust developer, and protocol security auditor.',
    avatarUrl: '👩‍💻',
    skills: ['Rust', 'Solidity', 'Circom', 'TypeScript', 'Go'],
    resumeUrl: null,
    socialLinks: { github: 'https://github.com', linkedin: 'https://linkedin.com' },
    emailVerified: true,
    createdAt: '2026-02-01T00:00:00Z',
    title: 'Cryptographic Protocol Engineer',
    rating: 2910,
    hackathonsWon: 6,
    openForTeams: true,
    interests: ['ZK-Rollups', 'Account Abstraction', 'Formal Verification'],
  },
  {
    id: 'hkr_3',
    name: 'Devansh Patel',
    email: 'devansh@hackersunity.dev',
    phone: '+91 91234 56789',
    role: UserRole.PARTICIPANT,
    college: 'BITS Pilani',
    organization: 'FinTech Pulse',
    graduationYear: 2026,
    bio: 'Low-latency financial engineering and high-concurrency cloud backend architect.',
    avatarUrl: '🚀',
    skills: ['Go', 'Kafka', 'Redis', 'Docker', 'Kubernetes'],
    resumeUrl: null,
    socialLinks: { github: 'https://github.com', linkedin: 'https://linkedin.com' },
    emailVerified: true,
    createdAt: '2026-02-15T00:00:00Z',
    title: 'High-Throughput Backend Specialist',
    rating: 2650,
    hackathonsWon: 3,
    openForTeams: false,
    interests: ['High Frequency Trading', 'Distributed Systems', 'Event-Driven Arch'],
  },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Elena Rostova', university: 'ETH Zurich', badge: 'Mythic Grandmaster', won: 6, score: 2910 },
  { rank: 2, name: 'Aarav Sharma', university: 'IIT Delhi', badge: 'Grandmaster', won: 4, score: 2840 },
  { rank: 3, name: 'Devansh Patel', university: 'BITS Pilani', badge: 'Master', won: 3, score: 2650 },
  { rank: 4, name: 'Sophia Chen', university: 'Stanford University', badge: 'Diamond I', won: 3, score: 2580 },
  { rank: 5, name: 'Marcus Vance', university: 'MIT', badge: 'Diamond II', won: 2, score: 2490 },
  { rank: 6, name: 'Priya Nair', university: 'IIT Bombay', badge: 'Platinum I', won: 2, score: 2410 },
];

export const MOCK_COLLEGES = [
  { rank: 1, name: 'IIT Delhi', country: 'India', builders: 1420, wins: 28, points: 98400 },
  { rank: 2, name: 'ETH Zurich', country: 'Switzerland', builders: 980, wins: 24, points: 89100 },
  { rank: 3, name: 'BITS Pilani', country: 'India', builders: 1250, wins: 21, points: 84300 },
  { rank: 4, name: 'Stanford University', country: 'United States', builders: 890, wins: 19, points: 79200 },
  { rank: 5, name: 'MIT', country: 'United States', builders: 940, wins: 18, points: 76500 },
];

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'news_1',
    title: "Hacker's Unity Launches Realtime Squads & Verification Architecture",
    slug: 'hackers-unity-launches-realtime-squads',
    description:
      'We are thrilled to unveil the next evolution of hackathon teamwork: Realtime collaborative team formation, instant builder verification, and broadcast alerts.',
    content: `## The Next Frontier in Builder Collaboration

At **Hacker's Unity**, our mission has always been simple: empower ambitious developers to connect with visionary peers, build production-grade prototypes, and compete on a global stage.

Today, we are thrilled to announce a major platform upgrade featuring:
- **Instant Squad Matchmaking**: Form teams with complementary skills across AI, Web3, and Fullstack.
- **Supabase Realtime Sync**: Never miss an invite or event milestone with zero-latency updates.
- **Enhanced Builder Profiles**: Highlight verified hackathon wins, GitHub proof of work, and dynamic occupation credentials.

### What's Coming Next
Stay tuned for automated judging pipelines, direct investor pitch rooms, and global college leaderboard seasons!`,
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
    category: NewsCategory.PLATFORM_UPDATES,
    authorId: 'usr_admin',
    authorName: "Hacker's Unity Editorial",
    authorAvatar: '⚡',
    status: NewsStatus.PUBLISHED,
    publishedAt: '2026-08-24T12:00:00Z',
    createdAt: '2026-08-24T12:00:00Z',
    updatedAt: '2026-08-24T12:00:00Z',
  },
  {
    id: 'news_2',
    title: 'AI Agent Hackathons Surge in 2026: Why Autonomous Workflows Dominate',
    slug: 'ai-agent-hackathons-surge-2026',
    description:
      'Explore how autonomous AI agents, multi-agent frameworks, and reasoning models are setting the benchmark for competition winning projects this season.',
    content: `## The Rise of Multi-Agent Systems in Hackathons

Over the past six months, hackathon submissions featuring **autonomous AI agent loops** have increased by over 300%. From automated smart contract audits to self-healing backend systems, developers are leveraging frameworks like LangGraph, CrewAI, and native LLM function calling.

### Key Factors Driving Winning AI Projects:
1. **Deterministic Guardrails**: Combining generative reasoning with structured database validations.
2. **Real-world Automation**: Moving beyond basic chatbots to end-to-end task execution agents.
3. **Multi-Agent Orchestration**: Specialized agents collaborating in real time to solve multi-step problems.

Explore our upcoming AI hackathons on Hacker's Unity to put your agent architectures to the test!`,
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    category: NewsCategory.AI,
    authorId: 'usr_admin',
    authorName: 'AI Innovation Lab',
    authorAvatar: '🤖',
    status: NewsStatus.PUBLISHED,
    publishedAt: '2026-08-20T10:00:00Z',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'news_3',
    title: 'Top 5 Strategies to Win Collegiate & Global Web3 Hackathons',
    slug: 'top-5-strategies-win-web3-hackathons',
    description:
      'Winning mentors and veteran hackathon champions share their blueprints for ideation, rapid prototyping, and winning pitch decks.',
    content: `## How Top Hackers Stand Out to Judges

Competing in high-stakes hackathons with thousands of dollars on the line requires more than just clean code. It requires product clarity, seamless user onboarding, and compelling presentation.

### The 5 Pillar Formula:
1. **Solve a Hyper-Specific Problem**: Narrow your scope and solve one pain point exceptionally well.
2. **Ship a Live Working Demo**: Always have a deployed URL with sample data ready for instant testing.
3. **Flawless UI/UX**: First impressions matter — polished typography and smooth state transitions captivate judges.
4. **Clear Economic / Impact Model**: Explain who uses it and why it creates tangible value.
5. **A 2-Minute High-Energy Pitch**: Lead with the problem, demo the live solution, and finish with future roadmap.`,
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
    category: NewsCategory.HACKATHONS,
    authorId: 'usr_admin',
    authorName: 'Hackathon Veterans Network',
    authorAvatar: '🏆',
    status: NewsStatus.PUBLISHED,
    publishedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'news_4',
    title: 'Summer 2026 Developer Fellowships & Paid Internship Grants Opened',
    slug: 'summer-2026-developer-fellowships-grants',
    description:
      'Explore newly announced summer fellowship programs, open-source stipends, and fast-track hiring pipelines for student builders.',
    content: `## Accelerate Your Tech Career Through Verified Proof-of-Work

Top startups and technology incubators are partnering with Hacker's Unity to recruit top builders directly from our hackathon leaderboards.

### Highlighted Opportunities:
- **Ecosystem Builder Grants**: Up to $5,000 equity-free grants for open-source prototypes built during hackathons.
- **Fast-Track Software Engineering Internships**: Direct interviews for students with top 5% elo ratings.
- **Venture Mentorship Programs**: 8-week intensive incubator for winning hackathon projects seeking seed funding.

Check the Opportunities hub regularly to apply with your Hacker's Unity public profile!`,
    coverImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop',
    category: NewsCategory.INTERNSHIPS,
    authorId: 'usr_admin',
    authorName: 'Talent & Grants Desk',
    authorAvatar: '💼',
    status: NewsStatus.PUBLISHED,
    publishedAt: '2026-08-10T14:30:00Z',
    createdAt: '2026-08-10T14:30:00Z',
    updatedAt: '2026-08-10T14:30:00Z',
  },
  {
    id: 'news_5',
    title: 'Next-Gen Web Architecture: Why Next.js 16 & Server Actions Are the Standard',
    slug: 'next-gen-web-architecture-nextjs-16',
    description:
      'Deep dive into state-of-the-art web performance, streaming SSR, and edge compute for high-speed hackathon prototyping.',
    content: `## Rapid Prototyping Without Sacrificing Performance

In modern competitive programming and hackathons, speed of iteration is everything. Next.js App Router combined with Supabase provides the ultimate full-stack developer experience.

### Why Builders Love This Stack:
- **Zero-Boilerplate Auth & Realtime**: Plug and play authentication and instant websocket listeners.
- **Server Actions**: Type-safe mutation without managing boilerplate REST endpoints.
- **Edge Performance**: Lightning fast TTFB and dynamic SEO optimization out of the box.`,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
    category: NewsCategory.TECHNOLOGY,
    authorId: 'usr_admin',
    authorName: 'Engineering Insights',
    authorAvatar: '⚡',
    status: NewsStatus.PUBLISHED,
    publishedAt: '2026-08-05T16:00:00Z',
    createdAt: '2026-08-05T16:00:00Z',
    updatedAt: '2026-08-05T16:00:00Z',
  },
];

