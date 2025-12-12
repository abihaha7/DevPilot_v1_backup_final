import globalsCSS from "../styles/globals.css";

import { Card } from '../ui/card.js';
import { Progress } from '../ui/progress.js';
import { Badge } from '../ui/badge.js';
import { Button } from '../ui/button.js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.js';
import { 
  BookOpen, 
  TrendingUp, 
  Target, 
  Star, 
  Brain, 
  Code, 
  Zap,
  Award,
  Clock,
  CheckCircle2
} from 'lucide-react';

// Inject CSS into <head> dynamically
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = globalsCSS;
  document.head.appendChild(style);
}


export function RightDashboard() {
  const learningProgress = [
    { language: 'Python', progress: 85, color: 'bg-yellow-400' },
    { language: 'JavaScript', progress: 72, color: 'bg-pink-400' },
    { language: 'Java', progress: 60, color: 'bg-orange-400' },
    { language: 'C++', progress: 45, color: 'bg-green-400' },
  ];

  const recentAchievements = [
    { title: 'Code Reviewer', icon: Star, color: 'text-yellow-400' },
    { title: 'Bug Hunter', icon: Target, color: 'text-red-400' },
    { title: 'Fast Learner', icon: Zap, color: 'text-blue-400' },
  ];

  const weeklyStats = [
    { label: 'Code Lines', value: '2,341', icon: Code },
    { label: 'Hours Coded', value: '24h', icon: Clock },
    { label: 'Problems Solved', value: '18', icon: CheckCircle2 },
  ];

  return (
   <div className="max-w-[380px] w-full h-screen bg-gray-900 border-l border-gray-800 flex flex-col p-6 space-y-4 overflow-y-auto mx-auto">

      {/* User Profile */}
      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-12 h-12 border border-gray-600 shrink-0">

            <AvatarImage src="https://images.unsplash.com/photo-1731951039706-0e793240bb32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXZlbG9wZXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTg4NDM1MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" />
            <AvatarFallback>AJ</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-gray-200 text-sm font-medium">Alex Johnson</h3>
            <p className="text-gray-400 text-xs">Beginner Developer</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
            Level 3
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
            7 day streak
          </Badge>
        </div>
      </Card>

      {/* Learning Progress */}
      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-4 h-4 text-purple-400" />
          <h3 className="text-gray-200 text-sm font-medium">Learning Progress</h3>
        </div>
        <div className="space-y-2">
          {learningProgress.map((item) => (
            <div key={item.language}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">{item.language}</span>
                <span className="text-gray-500">{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-1.5" />
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Stats */}
      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <h3 className="text-gray-200 text-sm font-medium">This Week</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {weeklyStats.map((stat) => (
            <div key={stat.label} className="text-center p-2 bg-gray-700/30 rounded">
              <stat.icon className="w-3 h-3 mx-auto mb-1 text-gray-400" />
              <div className="text-xs font-medium text-gray-200">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Learning Resources */}
      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h3 className="text-gray-200 text-sm font-medium">Learning Resources</h3>
        </div>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start text-left p-2 hover:bg-gray-700 h-auto">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
            <div>
              <div className="text-xs text-gray-200">Python Basics</div>
              <div className="text-xs text-gray-500">Interactive Tutorial</div>
            </div>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-left p-2 hover:bg-gray-700 h-auto">
            <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
            <div>
              <div className="text-xs text-gray-200">React Hooks</div>
              <div className="text-xs text-gray-500">Video Series</div>
            </div>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-left p-2 hover:bg-gray-700 h-auto">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <div>
              <div className="text-xs text-gray-200">Algorithm Practice</div>
              <div className="text-xs text-gray-500">Daily Challenge</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Recent Achievements */}
      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Award className="w-4 h-4 text-yellow-400" />
          <h3 className="text-gray-200 text-sm font-medium">Recent Achievements</h3>
        </div>
        <div className="space-y-1">
          {recentAchievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-700/20 rounded">
              <achievement.icon className={`w-3 h-3 ${achievement.color}`} />
              <span className="text-gray-200 text-xs">{achievement.title}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <h3 className="text-gray-200 text-sm font-medium mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-8">
            Start Learning Session
          </Button>
          <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-8">
            Practice Problems
          </Button>
        </div>
      </Card>
    </div>
  );
}