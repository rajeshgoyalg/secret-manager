import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Plus, ShieldCheck, FilePlus } from "lucide-react";

export function AIAssistant() {
  const [inputValue, setInputValue] = useState("");
  
  // AI Assistant is a mock feature at this point
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setInputValue("");
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h2 className="font-semibold">AI Assistant</h2>
      </div>
      
      <div className="p-4">
        <div className="bg-neutral-50 p-3 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Secret Manager Assistant</p>
              <p className="text-sm text-neutral-600 mt-1">
                I can help you manage your secrets more effectively. What would you like to do today?
              </p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full text-left px-3 py-2 justify-start h-auto"
            >
              <Plus className="h-4 w-4 mr-2 text-primary-500" /> Help me create new secrets
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-left px-3 py-2 justify-start h-auto"
            >
              <ShieldCheck className="h-4 w-4 mr-2 text-primary-500" /> Audit my secrets for security issues
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-left px-3 py-2 justify-start h-auto"
            >
              <FilePlus className="h-4 w-4 mr-2 text-primary-500" /> Help me migrate secrets between projects
            </Button>
          </div>
        </div>
        
        <form onSubmit={handleSendMessage} className="mt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Ask the AI assistant..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pr-10"
            />
            <Button 
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-600 p-1 h-auto"
              disabled={!inputValue.trim()}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  );
}
