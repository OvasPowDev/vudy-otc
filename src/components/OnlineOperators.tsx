import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface OnlineOperator {
  id: string;
  initials: string;
  color: string;
}

export function OnlineOperators() {
  const [operators, setOperators] = useState<OnlineOperator[]>([]);

  useEffect(() => {
    const channel = supabase.channel('operators-online');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineOps: OnlineOperator[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence && !onlineOps.find(op => op.id === presence.id)) {
              onlineOps.push({
                id: presence.id,
                initials: presence.initials || '??',
                color: presence.color || `hsl(${Math.random() * 360}, 70%, 50%)`
              });
            }
          });
        });
        
        setOperators(onlineOps);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track anonymous presence for this viewer
          await channel.track({
            id: Math.random().toString(36).substring(7),
            initials: 'OP',
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex -space-x-2">
      {operators.length === 0 ? (
        // Fallback avatars when no one is connected
        [...Array(3)].map((_, i) => (
          <Avatar key={i} className="w-10 h-10 border-2 border-primary">
            <AvatarFallback 
              className="text-white text-sm font-semibold"
              style={{
                backgroundImage: `linear-gradient(135deg, hsl(${199 + i * 10} 80% ${55 + i * 5}%), hsl(${210 + i * 10} 75% ${45 + i * 5}%))`
              }}
            >
              {String.fromCharCode(65 + i)}
            </AvatarFallback>
          </Avatar>
        ))
      ) : (
        operators.slice(0, 8).map((op) => (
          <Avatar key={op.id} className="w-10 h-10 border-2 border-primary">
            <AvatarFallback 
              className="text-white text-sm font-semibold"
              style={{ background: op.color }}
            >
              {op.initials}
            </AvatarFallback>
          </Avatar>
        ))
      )}
    </div>
  );
}
