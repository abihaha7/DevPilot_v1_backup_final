import { Card } from '../ui/card.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import { CheckCircle2, Circle, AlertTriangle, Clock, X, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { postToExtension } from '../../../utils/vscodeBridge';

interface TodoTrackerProps {
  onClose: () => void;
  onScan?: () => void;
  todos?: any[];
}

export function TodoTracker({ onClose, onScan, todos = [] }: TodoTrackerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 text-red-400 bg-red-500/10';
      case 'medium': return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
      case 'low': return 'border-green-500 text-green-400 bg-green-500/10';
      default: return 'border-gray-500 text-gray-400 bg-gray-500/10';
    }
  };

  const handleScan = () => {
    postToExtension('scanTODOs'); // ✅ trigger scan
    if (onScan) onScan();
  };

  if (isMinimized) {
    return (
      <Card className="bg-gray-900/95 border-gray-700 p-2 rounded-md shadow-lg backdrop-blur-sm w-48">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300 text-sm">TODO Tracker</span>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
            >
              <Minimize2 className="w-3 h-3 rotate-180" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/95 border-gray-700 p-4 rounded-md shadow-lg backdrop-blur-sm w-80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <h3 className="text-gray-200 text-sm font-medium">TODO Tracker</h3>
          <Badge variant="outline" className="border-orange-400 text-orange-300 text-xs">
            {todos.length}
          </Badge>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-xs">
            No TODOs found. Click “Scan” below.
          </div>
        ) : (
          todos.map((todo, i) => (
            <div key={i} className="p-2 bg-gray-800/40 rounded border-l-2 border-orange-400">
              <div className="flex items-start space-x-2">
                <Circle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-200 truncate">{todo.text}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{todo.file}:{todo.line}</span>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(todo.priority || 'low')}`}>
                      {todo.priority || 'low'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full text-xs text-gray-400 hover:text-gray-200 h-7"
          onClick={handleScan}
        >
          <Clock className="w-3 h-3 mr-1.5" />
          Scan project for TODOs
        </Button>
      </div>
    </Card>
  );
}
