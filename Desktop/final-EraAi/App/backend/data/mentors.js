// Dummy mentors for each stream
// Replace meetLink with real links before production

const MENTORS = {
  'DSA': [
    {
      name: 'Rajiv Sharma',
      title: 'Senior Software Engineer',
      company: 'Google',
      expertise: ['Data Structures', 'Algorithms', 'Competitive Programming', 'System Design'],
      bio: '8 years of experience at top product companies. Solved 1500+ problems on LeetCode. Passionate about helping students crack FAANG interviews.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Saturday', time: '10:00 AM – 11:00 AM IST' },
        { day: 'Sunday',   time: '4:00 PM – 5:00 PM IST' }
      ]
    },
    {
      name: 'Sneha Patel',
      title: 'Staff Engineer',
      company: 'Microsoft',
      expertise: ['Trees & Graphs', 'Dynamic Programming', 'Interview Prep'],
      bio: '6 years at Microsoft. Ex-competitive programmer. Mentored 200+ students who are now at top tech companies.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Saturday', time: '2:00 PM – 3:00 PM IST' },
        { day: 'Wednesday', time: '7:00 PM – 8:00 PM IST' }
      ]
    }
  ],
  'AI/ML': [
    {
      name: 'Dr. Arjun Mehta',
      title: 'ML Research Scientist',
      company: 'DeepMind',
      expertise: ['Deep Learning', 'NLP', 'Computer Vision', 'Research'],
      bio: 'PhD in Machine Learning. Published 12 papers. Worked on large language models and generative AI at DeepMind.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Saturday', time: '11:00 AM – 12:00 PM IST' },
        { day: 'Sunday',   time: '3:00 PM – 4:00 PM IST' }
      ]
    },
    {
      name: 'Priya Nair',
      title: 'Data Science Lead',
      company: 'Amazon',
      expertise: ['Machine Learning', 'MLOps', 'Data Engineering', 'AI Ethics'],
      bio: '7 years building production ML systems at Amazon. Passionate about responsible AI and helping newcomers navigate the ML career path.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Friday',   time: '6:00 PM – 7:00 PM IST' },
        { day: 'Sunday',   time: '10:00 AM – 11:00 AM IST' }
      ]
    }
  ],
  'Web Dev': [
    {
      name: 'Karan Verma',
      title: 'Full Stack Engineer',
      company: 'Flipkart',
      expertise: ['React', 'Node.js', 'System Design', 'Performance Optimization'],
      bio: '5 years at Flipkart building high-scale web apps. Open source contributor. Love talking about architecture and clean code.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Saturday', time: '9:00 AM – 10:00 AM IST' },
        { day: 'Thursday', time: '8:00 PM – 9:00 PM IST' }
      ]
    },
    {
      name: 'Ananya Singh',
      title: 'Frontend Architect',
      company: 'Razorpay',
      expertise: ['React', 'TypeScript', 'Web Performance', 'Accessibility'],
      bio: 'Building Razorpay\'s design system. Speaker at ReactConf India. Passionate about accessible and performant user interfaces.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Sunday',   time: '5:00 PM – 6:00 PM IST' },
        { day: 'Tuesday',  time: '7:00 PM – 8:00 PM IST' }
      ]
    }
  ],
  'CS Fundamentals': [
    {
      name: 'Vikram Iyer',
      title: 'Systems Engineer',
      company: 'Intel',
      expertise: ['Operating Systems', 'Networking', 'Databases', 'Compiler Design'],
      bio: '10 years in systems engineering. Strong believer that CS fundamentals are the foundation of everything. Helped 300+ students master core concepts.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Saturday', time: '3:00 PM – 4:00 PM IST' },
        { day: 'Sunday',   time: '11:00 AM – 12:00 PM IST' }
      ]
    },
    {
      name: 'Meera Joshi',
      title: 'Backend Engineer',
      company: 'Swiggy',
      expertise: ['Distributed Systems', 'SQL & NoSQL', 'OS Internals', 'Cloud Architecture'],
      bio: 'Scaling Swiggy\'s backend to handle millions of orders. Ex-professor turned engineer. Loves breaking down complex systems.',
      meetLink: 'ZOOM_LINK_PLACEHOLDER',
      slots: [
        { day: 'Friday',   time: '5:00 PM – 6:00 PM IST' },
        { day: 'Saturday', time: '12:00 PM – 1:00 PM IST' }
      ]
    }
  ]
};

module.exports = MENTORS;
