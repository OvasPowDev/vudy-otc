import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Static operators display (real-time presence removed during Supabase migration)
// Future: Could implement polling-based online status via Express API
const staticOperators = [
  { id: "1", initials: "OP", color: "hsl(199, 80%, 55%)" },
  { id: "2", initials: "LQ", color: "hsl(220, 75%, 50%)" },
  { id: "3", initials: "AD", color: "hsl(240, 70%, 55%)" },
];

export function OnlineOperators() {
  return (
    <div className="flex -space-x-2">
      {staticOperators.map((op) => (
        <Avatar key={op.id} className="w-10 h-10 border-2 border-primary">
          <AvatarFallback 
            className="text-white text-sm font-semibold"
            style={{ background: op.color }}
          >
            {op.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
