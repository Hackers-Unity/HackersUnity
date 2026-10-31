export interface GalleryMoment {
  src: string;
  label: string;
}

const cdn = (path: string) =>
  `https://res.cloudinary.com/p6qljeni/image/upload/f_auto,q_auto,w_800/${path}`;

export const GALLERY_MOMENTS_MAP = {
  hackstorm_stage: cdn("v1793192922/hackers-unity/gallery-moments/hackstorm_stage.jpg"),
  hackstorm_hall: cdn("v1793191867/hackers-unity/gallery-moments/hackstorm_hall.jpg"),
  hackstorm_winners: cdn("v1793191868/hackers-unity/gallery-moments/hackstorm_winners.jpg"),
  hackstorm_inauguration: cdn("v1793191873/hackers-unity/gallery-moments/hackstorm_inauguration.jpg"),
  hackstorm_speaker: cdn("v1793191874/hackers-unity/gallery-moments/hackstorm_speaker.jpg"),
  hackstorm_booth: cdn("v1793191877/hackers-unity/gallery-moments/hackstorm_booth.jpg"),
  hackstorm_developers: cdn("v1793191877/hackers-unity/gallery-moments/hackstorm_developers.jpg"),
  hackstorm_mentoring: cdn("v1793191887/hackers-unity/gallery-moments/hackstorm_mentoring.jpg"),
  hackstorm_discussions: cdn("v1793191881/hackers-unity/gallery-moments/hackstorm_discussions.jpg"),
  hackstorm_focus: cdn("v1793191889/hackers-unity/gallery-moments/hackstorm_focus.jpg"),
  stellar_bootcamp: cdn("v1793191888/hackers-unity/gallery-moments/stellar_bootcamp.jpg"),
  hive_mentors: cdn("v1793191889/hackers-unity/gallery-moments/hive_mentors.jpg"),
  CodeWars1: cdn("v1793191965/hackers-unity/gallery-moments/CodeWars1.jpg"),
  CodeWars2: cdn("v1793191927/hackers-unity/gallery-moments/CodeWars2.jpg"),
  CodeWars3: cdn("v1793191954/hackers-unity/gallery-moments/CodeWars3.jpg"),
  CodeWars4: cdn("v1793192007/hackers-unity/gallery-moments/CodeWars4.jpg"),
  CodeWars5: cdn("v1793191985/hackers-unity/gallery-moments/CodeWars5.jpg"),
  CodeWars6: cdn("v1793192031/hackers-unity/gallery-moments/CodeWars6.jpg"),
  CodeWars7: cdn("v1793192015/hackers-unity/gallery-moments/CodeWars7.jpg"),
  CodeWars8: cdn("v1793192135/hackers-unity/gallery-moments/CodeWars8.jpg"),
  CodeWars9: cdn("v1793192095/hackers-unity/gallery-moments/CodeWars9.jpg"),
  CodeWars10: cdn("v1793192091/hackers-unity/gallery-moments/CodeWars10.jpg"),
  CodeWars11: cdn("v1793192144/hackers-unity/gallery-moments/CodeWars11.jpg"),
  CodeWars12: cdn("v1793192185/hackers-unity/gallery-moments/CodeWars12.jpg"),
  CodeWars13: cdn("v1793192205/hackers-unity/gallery-moments/CodeWars13.jpg"),
  CodeWars14: cdn("v1793192206/hackers-unity/gallery-moments/CodeWars14.jpg"),
  CodeWars15: cdn("v1793192205/hackers-unity/gallery-moments/CodeWars15.jpg"),
  StellarHU: cdn("v1793192220/hackers-unity/gallery-moments/StellarHU.jpg"),
  StellarHU1: cdn("v1793192582/hackers-unity/gallery-moments/StellarHU1.jpg"),
  StellarHU2: cdn("v1793192595/hackers-unity/gallery-moments/StellarHU2.jpg"),
  workshop6: cdn("v1793192253/hackers-unity/gallery-moments/6.jpg"),
};

export const GALLERY_ROW_1: GalleryMoment[] = [
  { src: GALLERY_MOMENTS_MAP.hackstorm_stage, label: 'Hackstorm — Grand Stage' },
  { src: GALLERY_MOMENTS_MAP.CodeWars1, label: 'CodeWars — Inauguration Stage' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_hall, label: 'Hackstorm — Hacking Arena' },
  { src: GALLERY_MOMENTS_MAP.CodeWars2, label: 'CodeWars — Opening Ceremony' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_winners, label: 'Hackstorm — Winners' },
  { src: GALLERY_MOMENTS_MAP.CodeWars3, label: 'CodeWars — Keynote Session' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_inauguration, label: 'Hackstorm — Inauguration' },
  { src: GALLERY_MOMENTS_MAP.CodeWars4, label: 'CodeWars — Panel Discussion' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_speaker, label: 'Hackstorm — Speaker Session' },
  { src: GALLERY_MOMENTS_MAP.CodeWars5, label: 'CodeWars — Hacking Arena' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_booth, label: 'Hackstorm — Sponsor Booth' },
  { src: GALLERY_MOMENTS_MAP.CodeWars6, label: 'CodeWars — Team Collaboration' },
  { src: GALLERY_MOMENTS_MAP.CodeWars7, label: 'CodeWars — Demo Presentation' },
  { src: GALLERY_MOMENTS_MAP.StellarHU, label: 'Stellar Bootcamp — Workshop' },
];

export const GALLERY_ROW_2: GalleryMoment[] = [
  { src: GALLERY_MOMENTS_MAP.hackstorm_developers, label: 'Hackstorm — Developers' },
  { src: GALLERY_MOMENTS_MAP.CodeWars8, label: 'CodeWars — Mentoring Session' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_mentoring, label: 'Hackstorm — Mentoring' },
  { src: GALLERY_MOMENTS_MAP.CodeWars9, label: 'CodeWars — Judging Round' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_discussions, label: 'Hackstorm — Discussions' },
  { src: GALLERY_MOMENTS_MAP.CodeWars10, label: 'CodeWars — Audience' },
  { src: GALLERY_MOMENTS_MAP.hackstorm_focus, label: 'Hackstorm — Focus Mode' },
  { src: GALLERY_MOMENTS_MAP.CodeWars11, label: 'CodeWars — Prize Ceremony' },
  { src: GALLERY_MOMENTS_MAP.stellar_bootcamp, label: 'Stellar Bootcamp' },
  { src: GALLERY_MOMENTS_MAP.CodeWars12, label: 'CodeWars — Winners Celebration' },
  { src: GALLERY_MOMENTS_MAP.hive_mentors, label: 'Hive — Mentor Connect' },
  { src: GALLERY_MOMENTS_MAP.CodeWars13, label: 'CodeWars — Networking' },
  { src: GALLERY_MOMENTS_MAP.CodeWars14, label: 'CodeWars — Closing Ceremony' },
  { src: GALLERY_MOMENTS_MAP.CodeWars15, label: 'CodeWars — Group Photo' },
  { src: GALLERY_MOMENTS_MAP.StellarHU1, label: 'Stellar Bootcamp — Hands-on' },
  { src: GALLERY_MOMENTS_MAP.StellarHU2, label: 'Stellar Bootcamp — Community' },
];

