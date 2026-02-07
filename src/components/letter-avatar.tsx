import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LetterAvatarProps {
  name: string;
  size?: number;
}

const colors = [
  "bg-red-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-green-500",
  "bg-lime-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-fuchsia-500",
];

export default function LetterAvatar({ name, size = 64 }: LetterAvatarProps) {
  if (!name) return null;

  const letter = name[0].toUpperCase();

  const charCode = letter.charCodeAt(0);
  const bgColor = colors[charCode % colors.length];

  return (
    <Avatar
      className={cn("border-none w-full h-full", bgColor)}
      style={{ borderRadius: 0 }}
    >
      <AvatarFallback
        className={cn(
          "flex items-center justify-center text-black font-bold",
          bgColor,
        )}
        style={{ fontSize: size / 4 }}
      >
        {letter}
      </AvatarFallback>
    </Avatar>
  );
}
