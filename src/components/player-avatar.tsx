import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export function PlayerAvatar({
  player,
  size = "default",
  className,
}: {
  player: { name: string; profilePicUrl: string | null };
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {player.profilePicUrl && <AvatarImage src={player.profilePicUrl} alt="" />}
      <AvatarFallback>{initials(player.name)}</AvatarFallback>
    </Avatar>
  );
}
