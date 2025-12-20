export type QuizTopic = keyof typeof dashboardData.practiceProblems;
export type QuizLevel = "easy" | "medium" | "hard";

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: number;
};

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
    { id: "todo", label: "TODO Tracker" },
  ],

  recentAchievements: [
    { title: "Code Reviewer", icon: "Star", color: "text-yellow-400" },
    { title: "Bug Hunter", icon: "Target", color: "text-red-400" },
    { title: "Fast Learner", icon: "Zap", color: "text-blue-400" },
  ],

  // 🔥 Practice Problems / Quizzes
practiceProblems: {
  html: {
    easy: [
      {
        id: 1,
        question: "Which tag defines a hyperlink?",
        options: ["<link>", "<a>", "<href>", "<hyper>"],
        answer: 1,
      },
      {
        id: 2,
        question: "Which tag creates a line break?",
        options: ["<break>", "<lb>", "<br>", "<newline>"],
        answer: 2,
      },
    ],
    medium: [
      {
        id: 1,
        question: "Which attribute specifies an image source?",
        options: ["src", "href", "alt", "link"],
        answer: 0,
      },
      {
        id: 2,
        question: "Which tag is used for creating a table row?",
        options: ["<td>", "<tr>", "<th>", "<row>"],
        answer: 1,
      },
    ],
  },

  css: {
    easy: [
      {
        id: 1,
        question: "Which property controls text size?",
        options: ["font-style", "text-size", "font-size", "size"],
        answer: 2,
      },
      {
        id: 2,
        question: "Which property sets background color?",
        options: ["color", "background-color", "bg", "fill"],
        answer: 1,
      },
    ],
    hard: [
      {
        id: 1,
        question: "Which CSS layout module provides flexible box layouts?",
        options: ["Grid", "Flexbox", "Float", "Inline-block"],
        answer: 1,
      },
      {
        id: 2,
        question: "Which property defines the stacking order of elements?",
        options: ["z-index", "order", "stack", "layer"],
        answer: 0,
      },
    ],
  },

  js: {
    easy: [
      {
        id: 1,
        question: "Which keyword declares a constant?",
        options: ["let", "var", "const", "static"],
        answer: 2,
      },
      {
        id: 2,
        question: "Which method converts JSON string to object?",
        options: [
          "JSON.parse()",
          "JSON.stringify()",
          "Object.fromJSON()",
          "JSON.toObject()",
        ],
        answer: 0,
      },
    ],
    medium: [
      {
        id: 1,
        question: "Which operator checks both value and type?",
        options: ["==", "===", "!=", "!=="],
        answer: 1,
      },
      {
        id: 2,
        question: "Which method adds an element to the end of an array?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        answer: 0,
      },
    ],
  },
},
};