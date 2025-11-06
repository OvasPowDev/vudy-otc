import { User } from "@lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const navigate = useNavigate();
  
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleClick = () => {
    navigate("/profile");
  };

  return (
    <div 
      className="flex items-center gap-3 px-4 py-2 bg-card rounded-lg border cursor-pointer hover:bg-muted transition-colors" 
      onClick={handleClick}
      data-testid="div-user-profile"
    >
      <Avatar>
        <AvatarFallback className="bg-primary text-primary-foreground">
          {getInitials(user.email || "U")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">Welcome,</span>
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </div>
    </div>
  );
}
