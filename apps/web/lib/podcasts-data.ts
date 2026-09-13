export interface PodcastEpisode {
  id: string;
  episodeNumber: number;
  name: string;
  designation: string;
  company: string;
  companyType: 'amazon' | 'microsoft' | 'tcs' | 'macys' | 'ieee' | 'mphasis' | 'ssc' | 'ai';
  image: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  category: 'big-tech' | 'leadership' | 'ai-cloud' | 'product' | 'system-design';
  duration: string;
  durationSeconds: number;
  publishDate: string;
  featured?: boolean;
}

export const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: 'ep-amazon',
    episodeNumber: 1,
    name: 'Mihir Shelar',
    designation: 'Technical Manager',
    company: 'Amazon',
    companyType: 'amazon',
    image: '/podcasts/mihirshelar.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=-A9QjJcd32k&t=315s',
    videoId: '-A9QjJcd32k',
    title: 'Amazon Technical Manager Reveals Industry Secrets',
    tagline: 'Building technology at hyperscale, engineering leadership, and high-impact career growth.',
    description:
      'In this candid masterclass, Mihir Shelar dives deep into how Amazon builds distributed systems that withstand billion-user traffic, what leadership principles truly mean in daily code reviews, and actionable advice for developers aiming for engineering management.',
    tags: ['Cloud & Scale', 'Leadership', 'Amazon Culture'],
    category: 'big-tech',
    duration: '52:14',
    durationSeconds: 3134,
    publishDate: 'Aug 2025',
    featured: true,
  },
  {
    id: 'ep-microsoft',
    episodeNumber: 2,
    name: 'Krishna Kishor Tirupati',
    designation: 'Senior Software Engineer',
    company: 'Microsoft',
    companyType: 'microsoft',
    image: '/podcasts/kirshna.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=cS_8kLIzpHk',
    videoId: 'cS_8kLIzpHk',
    title: 'From Campus to Microsoft: Career Journey & Tech Growth',
    tagline: 'Placement strategies, mastering software engineering craft, and skills that matter in big tech.',
    description:
      'Krishna shares his exact blueprint transitioning from tier-3 campus to Microsoft SWE, tackling complex data structures, breaking down modern technical interview formats, and staying relevant amidst rapid industry shifts.',
    tags: ['Big Tech', 'Software Engineering', 'Campus Placements'],
    category: 'big-tech',
    duration: '44:28',
    durationSeconds: 2668,
    publishDate: 'Jul 2025',
  },
  {
    id: 'ep-tcs',
    episodeNumber: 3,
    name: 'Abhijit Roy',
    designation: 'Solution Architect',
    company: 'Tata Consultancy Services',
    companyType: 'tcs',
    image: '/podcasts/abhijitroy.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=pdqg4f1ijYM',
    videoId: 'pdqg4f1ijYM',
    title: 'AI, Innovation & The Future of Technology',
    tagline: 'Artificial Intelligence, cloud transformation, and real-world tech innovation trends.',
    description:
      'Abhijit Roy demystifies enterprise architecture, cloud migrations for Fortune 500 organizations, and how Generative AI is reshaping the solution architect role across global consultancies.',
    tags: ['Artificial Intelligence', 'Cloud', 'Innovation'],
    category: 'ai-cloud',
    duration: '48:32',
    durationSeconds: 2912,
    publishDate: 'Jul 2025',
  },
  {
    id: 'ep-macys',
    episodeNumber: 4,
    name: 'Ankur Bhatnagar',
    designation: 'Staff Software Engineer',
    company: "Macy's Tech (Ex-Accenture)",
    companyType: 'macys',
    image: '/podcasts/ankur.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=3eFj4r4x9AI',
    videoId: '3eFj4r4x9AI',
    title: 'The Truth About Becoming a Staff Software Engineer',
    tagline: 'Demystifying the staff engineer path, technical leadership, and engineering excellence.',
    description:
      'Ankur sheds light on the elusive Staff+ engineer track: how to influence engineering roadmaps across multiple cross-functional squads without direct managerial authority.',
    tags: ['Staff Engineering', 'Tech Leadership', 'Career Growth'],
    category: 'leadership',
    duration: '56:05',
    durationSeconds: 3365,
    publishDate: 'Jun 2025',
  },
  {
    id: 'ep-mphasis',
    episodeNumber: 5,
    name: 'Eshaan Jain',
    designation: 'Senior Product Manager',
    company: 'Mphasis Silverline (Ex-Amazon)',
    companyType: 'mphasis',
    image: '/podcasts/eshaan.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=dMZYpdd7XHI',
    videoId: 'dMZYpdd7XHI',
    title: 'No One Talks About This! Product Management Secrets',
    tagline: 'Realities of product management, building with engineering teams, and high-velocity shipping.',
    description:
      'Ex-Amazon PM Eshaan Jain reveals how product leaders define customer problems, write crystal clear PRDs, collaborate seamlessly with dev teams, and measure product success metrics.',
    tags: ['Product Management', 'Ex-Amazon', 'Product Strategy'],
    category: 'product',
    duration: '41:19',
    durationSeconds: 2479,
    publishDate: 'Jun 2025',
  },
  {
    id: 'ep-ssc',
    episodeNumber: 6,
    name: 'Surya Rao R',
    designation: 'Lead Software Engineer',
    company: 'SS&C Technologies',
    companyType: 'ssc',
    image: '/podcasts/surya_roy.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=KMftFbyMrJc',
    videoId: 'KMftFbyMrJc',
    title: 'Engineering Leadership & Scaling High-Impact Systems',
    tagline: 'Transitioning from contributor to leader, designing resilient architectures, and mentoring.',
    description:
      'Deep dive into FinTech engineering, real-time transaction processing, high-throughput microservice patterns, and what senior engineers need to master to step into tech lead roles.',
    tags: ['Engineering Leadership', 'System Design', 'FinTech'],
    category: 'system-design',
    duration: '46:40',
    durationSeconds: 2800,
    publishDate: 'May 2025',
  },
  {
    id: 'ep-ieee',
    episodeNumber: 7,
    name: 'Ratna Kumar Bonagiri',
    designation: 'Staff Engineer & IEEE Senior Leader',
    company: "Macy's / IEEE",
    companyType: 'ieee',
    image: '/podcasts/ratnakumar.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ka_9ZWvTJjU',
    videoId: 'Ka_9ZWvTJjU',
    title: 'Innovation, Leadership & Community-Driven Tech Growth',
    tagline: 'How community leadership and continuous learning build resilience and long-term career success.',
    description:
      'Ratna Kumar shares how volunteering with global engineering communities like IEEE accelerates technical careers, establishes patents, and connects student developers to world-class mentors.',
    tags: ['IEEE Leader', 'Community', 'Tech Innovation'],
    category: 'leadership',
    duration: '39:50',
    durationSeconds: 2390,
    publishDate: 'May 2025',
  },
  {
    id: 'ep-ai',
    episodeNumber: 8,
    name: 'Ather Husain',
    designation: 'Principal Engineer & Tech Lead',
    company: 'Enterprise Cloud & AI',
    companyType: 'ai',
    image: '/podcasts/arther.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=jm_4cse3wsE',
    videoId: 'jm_4cse3wsE',
    title: 'Agent RAG, LLMs & What Every AI Engineer Must Understand',
    tagline: 'Agentic workflows, RAG architectures, enterprise microservices, and modern generative AI.',
    description:
      'A technical masterclass in LLM architectures, context windows, vector embedding strategies, and building reliable autonomous AI agents capable of enterprise-grade tool calling.',
    tags: ['Agentic AI', 'RAG & LLMs', 'Enterprise Cloud'],
    category: 'ai-cloud',
    duration: '50:12',
    durationSeconds: 3012,
    publishDate: 'Apr 2025',
  },
];
