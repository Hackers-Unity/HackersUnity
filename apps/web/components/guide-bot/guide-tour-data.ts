import type { AnimationName } from '@/components/avatar';

export interface TourStep {
  id: string;
  targetId: string;
  badge: string;
  title: string;
  message: string;
  animation: AnimationName;
  durationMs: number; // 3-5 seconds per step
  dockPosition: 'top-left' | 'right' | 'top-right' | 'bottom-right' | 'left' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center-right';
  action?: {
    label: string;
    href?: string;
  };
}

export interface ChatSuggestion {
  id: string;
  label: string;
  query: string;
  isTourTrigger?: boolean;
}

export interface BotChatOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  isBuildTrigger?: boolean;
}

export interface AttachedFileMeta {
  name: string;
  size: string;
  content: string;
  isImage?: boolean;
  dataUrl?: string;
}

export interface BotChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  options?: BotChatOption[];
  eventDraft?: any; // ExtendedEvent
  attachedFile?: {
    name: string;
    size: string;
    isImage?: boolean;
    dataUrl?: string;
  };
  cta?: {
    label: string;
    href?: string;
    isTourTrigger?: boolean;
    action?: string;
  };
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'hero',
    targetId: 'hero-pill',
    badge: 'Hacker\'s Unity Arena',
    title: 'Welcome to Hacker\'s Unity 🚀',
    message: 'India\'s premier developer platform uniting 50,000+ student builders & founders!',
    animation: 'happy',
    durationMs: 4000,
    dockPosition: 'top-left',
  },
  {
    id: 'ai-command',
    targetId: 'ai-command',
    badge: 'AI Innovation Hub',
    title: 'Groq AI Command Center ⚡',
    message: 'Brainstorm hackathon projects, match with skilled teammates, and discover events instantly.',
    animation: 'thinking',
    durationMs: 4200,
    dockPosition: 'right',
  },
  {
    id: 'metrics',
    targetId: 'metrics-ticker',
    badge: 'Community Impact',
    title: '50,000+ Strong Network 📈',
    message: '10+ flagship hackathons, 30+ physical events, and 5M+ developer impressions across India.',
    animation: 'proud',
    durationMs: 4000,
    dockPosition: 'top-center',
  },
  {
    id: 'hackathons',
    targetId: 'first-hackathon-card',
    badge: 'Flagship Arenas',
    title: 'Compete & Win $350K+ Prizes 🏆',
    message: 'Explore active hackathons across AI, Web3 & DeepTech with verified cash payouts.',
    animation: 'excited',
    durationMs: 4500,
    dockPosition: 'bottom-left',
    action: {
      label: 'Explore Hackathons →',
      href: '/hackathons',
    },
  },
  {
    id: 'gallery',
    targetId: 'gallery',
    badge: 'Live Experience',
    title: 'Hackstorm & CodeWars Arena 📸',
    message: 'Real on-ground glimpses of builders collaborating and pitching to industry leaders!',
    animation: 'curious',
    durationMs: 4000,
    dockPosition: 'top-right',
  },
  {
    id: 'builder-standard',
    targetId: 'builder-card-1',
    badge: 'The Builder Standard',
    title: 'From Projects to Startups 💡',
    message: 'We help promising builders validate prototypes and turn them into venture-funded startups.',
    animation: 'proud',
    durationMs: 4200,
    dockPosition: 'left',
  },
  {
    id: 'podcasts',
    targetId: 'podcasts',
    badge: 'Industry Masterclasses',
    title: 'Learn from Tech Pioneers 🎙️',
    message: 'Candid podcasts with engineering leaders from Amazon, Microsoft, IEEE & top AI labs.',
    animation: 'listening',
    durationMs: 4200,
    dockPosition: 'bottom-right',
    action: {
      label: 'Watch Podcasts →',
      href: '/podcasts',
    },
  },
  {
    id: 'workshops',
    targetId: 'workshop-card',
    badge: 'Developer Sprints',
    title: 'Hands-on Tech Workshops 🛠️',
    message: 'In-person developer workshops on Web3, Stellar & AI hosted directly at top campuses.',
    animation: 'working',
    durationMs: 4200,
    dockPosition: 'top-left',
  },
  {
    id: 'host-hackathon',
    targetId: 'host-cta-card',
    badge: 'Organizer Suite',
    title: 'Host Your Own Hackathon 🌟',
    message: 'Launch your hackathon in under 5 minutes with automated review sandboxes & 50k+ reach.',
    animation: 'playful',
    durationMs: 4500,
    dockPosition: 'bottom-center',
    action: {
      label: 'Host Free →',
      href: '/host',
    },
  },
  {
    id: 'campus-ambassador',
    targetId: 'campus-ambassador',
    badge: 'Student Leadership',
    title: 'Become a Campus Ambassador 🎓',
    message: 'Lead the developer movement at your university with founder mentorship & exclusive perks!',
    animation: 'celebrate',
    durationMs: 4500,
    dockPosition: 'top-right',
    action: {
      label: 'Join Program →',
      href: '/mentor',
    },
  },
];

export const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: 'build',
    label: '⚡ Auto-Host / Create Hackathon',
    query: 'I want to auto-create and host a hackathon with AI',
  },
  {
    id: 'tour',
    label: '🚀 Tour Hacker\'s Unity platform',
    query: 'Take me on a tour of Hacker\'s Unity',
    isTourTrigger: true,
  },
  {
    id: 'host',
    label: '🌟 How to host a hackathon?',
    query: 'How can I host a hackathon on Hacker\'s Unity?',
  },
  {
    id: 'hackathons',
    label: '🏆 Live hackathons & prizes',
    query: 'What upcoming hackathons and prize pools are available?',
  },
  {
    id: 'ambassador',
    label: '🎓 Campus Ambassador program',
    query: 'Tell me about the Campus Ambassador Program',
  },
  {
    id: 'team',
    label: '👥 How to find teammates?',
    query: 'How do I find teammates to build hackathon projects?',
  },
  {
    id: 'expressions',
    label: '✨ HUe\'s 30+ Expressions',
    query: 'Show me your expressions and moods',
  },
];

// Fallback Smart Query Resolver for Hacker's Unity
export function resolveBotQuery(query: string): {
  text: string;
  animation: AnimationName;
  options?: BotChatOption[];
  cta?: { label: string; href?: string; isTourTrigger?: boolean };
} {
  const q = query.toLowerCase().trim();

  // Greetings in English & Hindi/Hinglish
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.startsWith('hi ') ||
    q.startsWith('hello ') ||
    q.startsWith('hey ') ||
    q.includes('namaste') ||
    q.includes('kaise ho') ||
    q.includes('kya haal') ||
    q.includes('sup') ||
    q.includes('good morning') ||
    q.includes('good evening')
  ) {
    return {
      text: "Hey there! Kaise ho? 👋 I'm HUe, your AI companion on Hacker's Unity.\n\nAsk me anything — about Hacker's Unity, finding live hackathons, team matching, hosting events, or any coding & tech questions! How can I help you today? 🚀",
      animation: 'happy',
    };
  }

  // Capabilities & Help ("kya kar sakte ho", "what can you do", "help", "who are you")
  if (
    q.includes('kya kar sakte') ||
    q.includes('what can you do') ||
    q.includes('what do you do') ||
    q.includes('who are you') ||
    q.includes('kya ho tum') ||
    q.includes('capabilities') ||
    q.includes('help me') ||
    q.includes('features')
  ) {
    return {
      text: "I'm HUe, your intelligent AI companion & hackathon copilot on Hacker's Unity! ⚡ Here's what I can do:\n\n• 💡 **Answer Any Tech / Coding Question**: Next.js, React, Python, Solidity, AI/ML, debugging, system design, or project ideas.\n• 🏆 **Discover Hackathons**: Browse active competitions with verified cash prizes up to $350K+.\n• ⚡ **Auto-Host Hackathons**: Draft full hackathons from your natural brief or uploaded poster.\n• 🎓 **Campus Ambassador Guide**: Learn how to become a CSAP lead in your college.\n• 👥 **Teammate Finder**: Pair up with skilled builders across AI, Web3 & Fullstack.\n• 🚀 **Interactive Tour**: Guide you through every feature on Hacker's Unity.\n\nFeel free to ask me any question!",
      animation: 'excited',
    };
  }

  // Hacker's Unity Platform Knowledge ("what is hackers unity", "hackers unity kya hai", "about platform", etc.)
  if (
    q.includes('hackers unity') ||
    q.includes("hacker's unity") ||
    q.includes('hacker unity') ||
    q.includes('about platform') ||
    q.includes('platform ke baare') ||
    q.includes('ye kya hai') ||
    q.includes('kya hai ye') ||
    (q.includes('what is') && q.includes('platform'))
  ) {
    return {
      text: "Hacker's Unity is India's premier developer platform and fastest-growing hackathon community! 🚀\n\nFounded by Jha Suraj Kumar and co-founded by Chinmay Bhatt (CEO), we unite 50,000+ student developers across 85+ partner universities and 30+ top tech partners.\n\nKey Highlights:\n• 🏆 **$350K+ Total Prize Pools**: Flagship arenas like Hackstorm, CodeWars, Stellar Bootcamp, and AI Agent Hackathon.\n• ⚡ **AI Event Architect**: Auto-create, draft, and launch hackathons in under 5 minutes.\n• 🎓 **Campus Ambassador Program (CSAP)**: Student leadership across 85+ universities with 1-on-1 founder mentorship & swag kits.\n• 👥 **AI Teammate Matchmaking**: Pair up with skilled developers across AI, Web3 & Fullstack.\n• 🎙️ **Masterclass Podcasts**: Candid conversations with tech leaders from Amazon, Microsoft & IEEE.\n\nOur philosophy: *'Don't just build projects. Build products.'* Turning weekend prototypes into venture-backed startups!",
      animation: 'proud',
      cta: {
        label: 'Explore Hackathons ➔',
        href: '/hackathons',
      },
    };
  }

  // Specific emotion / expression triggers
  if (q.includes('wink')) {
    return {
      text: "Always got your back! 😉 Keep innovating and building products that matter! ✨",
      animation: 'wink',
    };
  }
  if (q.includes('love') || q.includes('pyaar') || q.includes('dil')) {
    return {
      text: "Sending all my love to you and the incredible Hacker's Unity developer community! 💖🚀",
      animation: 'love',
    };
  }
  if (q.includes('cool') || q.includes('swagger') || q.includes('shades')) {
    return {
      text: "Smooth, confident, and ready to ship production code. Let's do this! 😎⚡",
      animation: 'cool',
    };
  }
  if (q.includes('starstruck') || q.includes('awe') || q.includes('wow') || q.includes('wonder')) {
    return {
      text: "Whoa! Over $350K+ in prize pools and 50,000+ top builders across India?! Truly mind-blowing! 🤩🏆",
      animation: 'starstruck',
    };
  }
  if (q.includes('determined') || q.includes('focus') || q.includes('locked in')) {
    return {
      text: "Locked in! Focused builder mode engaged. Time to turn ideas into high-impact startups! 💻⚡",
      animation: 'determined',
    };
  }
  if (q.includes('dance') || q.includes('party') || q.includes('nach')) {
    return {
      text: "Hackathon submission accepted! Let's celebrate with a victory dance! 🕺🎉",
      animation: 'dance',
    };
  }
  if (q.includes('giggle') || q.includes('laugh') || q.includes('tickle') || q.includes('joke')) {
    return {
      text: "Hehehe that tickles! 🤭 Why do programmers prefer dark mode? Because light attracts bugs! 🐛😂",
      animation: 'giggle',
    };
  }
  if (q.includes('dizzy') || q.includes('spin') || q.includes('chakkar')) {
    return {
      text: "Whoa... too many recursive function calls without a base case! Head is spinning! 😵‍💫💫",
      animation: 'dizzy',
    };
  }

  // Tour trigger
  if (
    q.includes('tour') ||
    q.includes('walkthrough') ||
    q.includes('guide me') ||
    q.includes('show me around') ||
    q.includes('explain website') ||
    q.includes('ghumao')
  ) {
    return {
      text: 'Starting your automatic platform tour now! 🚀 Hang tight while I fly to each card and explain how it works.',
      animation: 'excited',
      cta: {
        label: 'Starting Tour...',
        isTourTrigger: true,
      },
    };
  }

  // Host / Auto-Build Hackathon
  if (
    q.includes('host') ||
    q.includes('organize') ||
    q.includes('organizer') ||
    q.includes('conduct hackathon') ||
    q.includes('create event') ||
    q.includes('auto-host') ||
    q.includes('auto host')
  ) {
    return {
      text: 'I can auto-architect and host your entire hackathon in seconds! ⚡ You get automated submission review sandboxes, verified judge rubrics, and reach across 50,000+ developers.\n\nChoose an option below or describe your event (or attach a poster/brochure with 📎):',
      animation: 'proud',
      options: [
        {
          id: 'opt-1',
          label: 'Option 1: 💻 36h Online AI Sprint (₹1,00,000 Prizes)',
          value: 'Host a 36-hour Online AI Sprint with ₹1,00,000 cash prizes, tracks in Agentic AI and LLM apps.',
          description: 'Virtual hackathon open globally for all student builders.',
          isBuildTrigger: true,
        },
        {
          id: 'opt-2',
          label: 'Option 2: 🏫 Inter-College Offline Hackathon (₹50,000 Prizes)',
          value: 'Host a 24-hour Inter-College offline hackathon at campus in Delhi NCR with ₹50,000 prize pool.',
          description: 'On-ground campus hackathon with mentor workshops & swag.',
          isBuildTrigger: true,
        },
        {
          id: 'opt-3',
          label: 'Option 3: 🌐 Global Web3 & DeFi Sprint ($15,000 Prizes)',
          value: 'Host "ZeroKnowledge Sprint", a 48h global Web3 hackathon with $15,000 prize pool on DeFi & ZK-Proofs.',
          description: 'High-stakes developer sprint with crypto & venture grants.',
          isBuildTrigger: true,
        },
        {
          id: 'opt-4',
          label: 'Option 4: 📎 Attach Event Poster / Brochure to Auto-Fill',
          value: 'I want to upload my event poster/brochure and have HUe auto-create the hackathon.',
          description: 'Use the 📎 paperclip button to scan flyer text & dates with AI.',
        },
      ],
      cta: {
        label: 'Open Host Portal ➔',
        href: '/host',
      },
    };
  }

  // Hackathons & Prizes
  if (
    q.includes('hackathon') ||
    q.includes('prize') ||
    q.includes('compete') ||
    q.includes('competition') ||
    q.includes('events') ||
    q.includes('bounties') ||
    q.includes('cash')
  ) {
    return {
      text: 'We feature 15+ live & upcoming hackathons across AI Agents, Web3 & DeepTech with over $350,000+ in verified cash payouts! 🏆\n\nYou can explore flagship arenas like Hackstorm, CodeWars, and Stellar Bootcamp on our hackathons page.',
      animation: 'excited',
      cta: {
        label: 'Explore All Hackathons ➔',
        href: '/hackathons',
      },
    };
  }

  // Campus Ambassador / CSAP
  if (
    q.includes('ambassador') ||
    q.includes('csap') ||
    q.includes('campus') ||
    q.includes('college lead') ||
    q.includes('representative')
  ) {
    return {
      text: "The Hacker's Unity Campus Ambassador Program (CSAP) empowers student leaders across 85+ partner universities! 🎓\n\nPerks & Benefits:\n• 1-on-1 mentorship from founders Suraj & Chinmay\n• Official verified leadership certificates & LORs\n• Free VIP event passes to flagship hackathons\n• Exclusive HU merchandise kit (hoodies, t-shirts, stickers)\n• Stipends and performance grants for top community builders",
      animation: 'happy',
      cta: {
        label: 'Apply for Ambassador Program ➔',
        href: '/mentor',
      },
    };
  }

  // Teammates & Matchmaking
  if (
    q.includes('team') ||
    q.includes('teammate') ||
    q.includes('partner') ||
    q.includes('find members') ||
    q.includes('solo')
  ) {
    return {
      text: "Need an unstoppable hackathon squad? 👥 You can find verified builders through our AI Command Center by role (AI/ML, Next.js Fullstack, Web3 Smart Contracts, UI/UX design) and tech stack!",
      animation: 'thinking',
      cta: {
        label: 'Try AI Teammate Finder ➔',
        href: '#ai-command',
      },
    };
  }

  // Coding & Tech Guidance
  if (
    q.includes('react') ||
    q.includes('nextjs') ||
    q.includes('next.js') ||
    q.includes('python') ||
    q.includes('javascript') ||
    q.includes('typescript') ||
    q.includes('solidity') ||
    q.includes('web3') ||
    q.includes('ai') ||
    q.includes('machine learning') ||
    q.includes('database') ||
    q.includes('sql') ||
    q.includes('bug') ||
    q.includes('error') ||
    q.includes('code') ||
    q.includes('programming')
  ) {
    return {
      text: "Got a tech question or debugging challenge? 💻\n\nI can help you architect fullstack web apps, write clean TypeScript/React code, structure smart contracts on Ethereum/Stellar, or implement AI agent workflows. Ask me any specific code question or share your error trace!",
      animation: 'working',
    };
  }

  // Project Ideas & Winning Hackathons
  if (
    q.includes('idea') ||
    q.includes('project') ||
    q.includes('pitch') ||
    q.includes('how to win') ||
    q.includes('tips') ||
    q.includes('kaise jeete')
  ) {
    return {
      text: "Here are 4 golden rules to build a winning hackathon project: 🏆\n\n1. 🎯 **Solve a Real Problem**: Don't just build a toy wrapper; focus on a specific, painful problem users actually experience.\n2. ⚡ **Working MVP > Feature Bloat**: A polished demo that does one thing brilliantly beats 10 half-baked features every time.\n3. 🚀 **Pitch the Product, Not Just Code**: Show judges the business impact, user onboarding flow, and future roadmap.\n4. 🎨 **Clean UI / UX**: A great interface immediately builds credibility with judges in under 30 seconds!\n\nWhat domain are you thinking about building in? (AI, Web3, FinTech, DevTools, EdTech)",
      animation: 'proud',
    };
  }

  // Podcasts
  if (
    q.includes('podcast') ||
    q.includes('interview') ||
    q.includes('watch') ||
    q.includes('video') ||
    q.includes('leaders')
  ) {
    return {
      text: "Tune into our exclusive masterclass podcasts with engineering directors & founders from Amazon, Microsoft, Macy's, and IEEE discussing AI architectures, career growth, and startup execution! 🎙️",
      animation: 'listening',
      cta: {
        label: 'Watch Podcast Episodes ➔',
        href: '/podcasts',
      },
    };
  }

  // Workshops
  if (
    q.includes('workshop') ||
    q.includes('bootcamp') ||
    q.includes('learn') ||
    q.includes('stellar') ||
    q.includes('deeptech')
  ) {
    return {
      text: "We organize hands-on developer sprints and bootcamps at engineering colleges covering Stellar blockchain, agentic AI, and system design with direct mentor feedback! 🛠️",
      animation: 'working',
      cta: {
        label: 'Check Workshops Section ➔',
        href: '#workshops',
      },
    };
  }

  // Founders & About
  if (
    q.includes('founder') ||
    q.includes('who made') ||
    q.includes('about') ||
    q.includes('team behind') ||
    q.includes('suraj') ||
    q.includes('chinmay')
  ) {
    return {
      text: "Hacker's Unity is India's fastest-growing hackathon community and developer platform, founded by Jha Suraj Kumar and co-founded by Chinmay Bhatt (CEO). We are uniting 50,000+ builders to turn weekend prototypes into real venture-backed startups! 🚀",
      animation: 'celebrate',
      cta: {
        label: "About Hacker's Unity ➔",
        href: '/about',
      },
    };
  }

  return {
    text: "I'm HUe, your AI companion on Hacker's Unity! 🚀 I can help you with anything from hackathon strategies, coding & technical questions, to exploring Hacker's Unity platform features and auto-hosting events.\n\nWhat would you like to know or build today?",
    animation: 'playful',
  };
}
