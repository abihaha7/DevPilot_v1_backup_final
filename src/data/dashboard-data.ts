export const dashboardData = {
  user: {
    name: "Hooria",
    role: "Student Developer",
    activeTrack: "Web Development",
    avatar: "https://via.placeholder.com/150",
    level: 1,
  },

  progress: {
    completedLessons: 8,
    totalLessons: 20,
    streak: 4,
  },

  recentActivity: [
    { id: 1, title: "HTML Basics", time: "2 hours ago" },
    { id: 2, title: "CSS Flexbox", time: "Yesterday" },
  ],

  quickActions: [
    { id: "learn", label: "Continue Learning" },
    { id: "chat", label: "Open Chat" },
    { id: "commit", label: "Generate Commit" },
    { id: "todo", label: "TODO Tracker" }
  ],

  recentAchievements: [
    { title: "Code Reviewer", icon: "Star", color: "text-yellow-400" },
    { title: "Bug Hunter", icon: "Target", color: "text-red-400" },
    { title: "Fast Learner", icon: "Zap", color: "text-blue-400" }
  ],
};