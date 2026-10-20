export const suggestedPrompts = [
  'Find me a suite for two people for three nights under ₹40,000.',
  'What is available this weekend with a private terrace?',
  'Book the Chef\u2019s Table for two, tomorrow evening.',
  'What makes The Black Label different from The Don?',
]

export const sampleConversation = [
  {
    id: 'm1',
    role: 'user',
    text: 'Find me a suite for two people for three nights under ₹40,000.',
  },
  {
    id: 'm2',
    role: 'ai',
    text: 'Good evening. I found two suites matching your preferences.',
    tool: 'Searching availability · 3 nights · 2 guests',
    recommendations: ['the-don', 'the-consigliere'],
  },
]

export const priorConversations = [
  { id: 'conv-1', title: 'Weekend stay for two', time: '2 days ago' },
  { id: 'conv-2', title: 'Anniversary dinner booking', time: '1 week ago' },
  { id: 'conv-3', title: 'Family Estate availability', time: '2 weeks ago' },
]
