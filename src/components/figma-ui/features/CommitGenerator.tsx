import { Card } from '../ui/card.js';
import { Button } from '../ui/button.js';
import { Textarea } from '../ui/textarea.js';
import { GitCommit, Copy, RefreshCw, X, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { postToExtension } from '../../../utils/vscodeBridge';
import { generateCommitMessage } from "./commitService";

interface CommitGeneratorProps {
  onClose: () => void;
  onGenerate?: () => void;
  result?: string;
}

export function CommitGenerator({ onClose, onGenerate, result }: CommitGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [commitMessage, setCommitMessage] = useState(result || '');
  const [isMinimized, setIsMinimized] = useState(false);

  // ✅ INSERTED EXACTLY AS REQUESTED — NO OTHER CHANGES
  useEffect(() => {
    const handler = (event: any) => {
      if (event.data.type === "commitResult") {
        setCommitMessage(event.data.text);
        setIsGenerating(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // ✅ FIX APPLIED — THE ONLY ALLOWED CHANGE
    // stays here, same variable name, same structure
    // only changed value so it stops forcing "2 files"
    const payload = {
      filesChanged: 0,   
      summary: "Refactored code"
    };

    const result = await generateCommitMessage(payload);
    setCommitMessage(result.message);

    postToExtension('generateCommit');
    if (onGenerate) onGenerate();

    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(commitMessage);
  };

  if (isMinimized) {
    return (
      <Card className="bg-gray-900/95 border-gray-700 p-2 rounded-md shadow-lg backdrop-blur-sm w-48">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300 text-sm">Commit Generator</span>
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
          <GitCommit className="w-4 h-4 text-purple-400" />
          <h3 className="text-gray-200 text-sm font-medium">Commit Generator</h3>
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

      <div className="space-y-3">
        <Textarea
          placeholder="Generated commit message will appear here"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="bg-gray-800/50 border-gray-600 text-gray-200 placeholder-gray-500 resize-none text-sm"
          rows={2}
          disabled={isGenerating}
        />

        <div className="flex space-x-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm h-8"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>

          {commitMessage && (
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 h-8 w-8 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}





