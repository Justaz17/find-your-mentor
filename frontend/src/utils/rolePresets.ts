export interface RolePreset {
  role: string;
  icon: string;
  skills: string[];
}

export interface CategoryPreset {
  category: string;
  icon: string;
  roles: RolePreset[];
}

export const ROLE_PRESETS: CategoryPreset[] = [
  {
    category: 'Technology',
    icon: 'laptop',
    roles: [
      {
        role: 'Full Stack Developer',
        icon: 'code-braces',
        skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'System Design'],
      },
      {
        role: 'Frontend Developer',
        icon: 'monitor',
        skills: ['JavaScript', 'React', 'React Native'],
      },
      {
        role: 'Data Scientist',
        icon: 'chart-scatter-plot',
        skills: ['Python', 'Data Science', 'Machine Learning', 'SQL'],
      },
      {
        role: 'DevOps / Cloud Engineer',
        icon: 'cloud-outline',
        skills: ['DevOps', 'Cloud Computing', 'Cybersecurity', 'System Design'],
      },
      {
        role: 'Mobile Developer',
        icon: 'cellphone',
        skills: ['React Native', 'iOS Development', 'Android Development'],
      },
    ],
  },
  {
    category: 'Business & Career',
    icon: 'briefcase',
    roles: [
      {
        role: 'Entrepreneur / Founder',
        icon: 'rocket-launch-outline',
        skills: ['Entrepreneurship', 'Startup Coaching', 'Product Management', 'Sales', 'Networking'],
      },
      {
        role: 'Project Manager',
        icon: 'clipboard-list-outline',
        skills: ['Project Management', 'Product Management', 'Leadership', 'Negotiation'],
      },
      {
        role: 'Career Switcher',
        icon: 'swap-horizontal',
        skills: ['CV Review', 'Interview Prep', 'LinkedIn Optimisation', 'Networking'],
      },
      {
        role: 'Sales Professional',
        icon: 'handshake-outline',
        skills: ['Sales', 'Negotiation', 'Public Speaking', 'Networking'],
      },
    ],
  },
  {
    category: 'Design',
    icon: 'palette',
    roles: [
      {
        role: 'UI/UX Designer',
        icon: 'pencil-ruler',
        skills: ['UI/UX Design', 'Figma', 'Design Systems', 'Illustration'],
      },
      {
        role: 'Brand Designer',
        icon: 'brush-outline',
        skills: ['Graphic Design', 'Branding', 'Typography', 'Illustration'],
      },
      {
        role: 'Motion Designer',
        icon: 'animation-play-outline',
        skills: ['Motion Design', 'Graphic Design'],
      },
    ],
  },
  {
    category: 'Creative Arts',
    icon: 'camera',
    roles: [
      {
        role: 'Musician',
        icon: 'music-note',
        skills: ['Music Theory', 'Guitar', 'Piano', 'Singing', 'Music Production'],
      },
      {
        role: 'Music Producer',
        icon: 'equalizer',
        skills: ['Music Production', 'Music Theory'],
      },
      {
        role: 'Content Creator',
        icon: 'video-outline',
        skills: ['Photography', 'Video Editing', 'Creative Writing'],
      },
      {
        role: 'Visual Artist',
        icon: 'draw',
        skills: ['Painting', 'Digital Art', 'Illustration', 'Photography'],
      },
    ],
  },
  {
    category: 'Fitness',
    icon: 'dumbbell',
    roles: [
      {
        role: 'Personal Trainer',
        icon: 'weight-lifter',
        skills: ['Strength Training', 'Nutrition', 'HIIT', 'Flexibility & Mobility'],
      },
      {
        role: 'Sports Coach',
        icon: 'whistle-outline',
        skills: ['Football', 'Running', 'Cycling', 'Swimming', 'Sports Psychology'],
      },
      {
        role: 'Yoga & Wellness',
        icon: 'meditation',
        skills: ['Yoga', 'Flexibility & Mobility', 'Mindfulness & Meditation'],
      },
    ],
  },
  {
    category: 'Personal Development',
    icon: 'brain',
    roles: [
      {
        role: 'Life Coach',
        icon: 'compass-outline',
        skills: ['Life Coaching', 'Goal Setting', 'Confidence Building', 'Habit Formation'],
      },
      {
        role: 'Productivity Coach',
        icon: 'lightning-bolt-outline',
        skills: ['Productivity', 'Time Management', 'Goal Setting', 'Habit Formation', 'Journaling'],
      },
      {
        role: 'Mindfulness Coach',
        icon: 'head-heart-outline',
        skills: ['Mindfulness & Meditation', 'Anxiety Management', 'Journaling', 'Life Coaching'],
      },
    ],
  },
  {
    category: 'Finance',
    icon: 'currency-eur',
    roles: [
      {
        role: 'Financial Advisor',
        icon: 'chart-line',
        skills: ['Financial Planning', 'Personal Budgeting', 'Tax Planning', 'Retirement Planning'],
      },
      {
        role: 'Investor',
        icon: 'trending-up',
        skills: ['Investing Basics', 'Stock Market', 'Cryptocurrency', 'Real Estate Investing'],
      },
    ],
  },
  {
    category: 'Languages',
    icon: 'translate',
    roles: [
      {
        role: 'Language Tutor',
        icon: 'forum-outline',
        skills: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin', 'Japanese', 'Arabic', 'Irish', 'Lithuanian'],
      },
    ],
  },
];