import { useState } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
}

export function Header({ title, onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <header className="bg-white border-b border-neutral-200 flex items-center justify-between p-4 h-16">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleSidebar}
          className="md:hidden text-neutral-500 hover:text-neutral-900 p-1"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search secrets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-md"
          />
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 rounded-full hover:bg-neutral-100 relative"
        >
          <Bell className="h-5 w-5 text-neutral-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary-100 text-primary-500">
              {user?.fullName?.[0] || user?.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  );
}
