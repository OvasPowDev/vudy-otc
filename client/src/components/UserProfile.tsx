import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-lg border">
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
