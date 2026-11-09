
import { UserRound } from "lucide-react";

export default function Avatar({ avatarId = null, alt = "", className = "" }) {
  const id = typeof avatarId === "string" && /^avatar-\d{2}$/.test(avatarId)
    ? avatarId
    : null;

  if (!id) {
    return (
      <div
        role="img"
        aria-label={alt || "Usuário sem foto de perfil"}
        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-500 ${className}`}
      >
        <UserRound className="w-1/2 h-1/2" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={`/avatars/${id}.svg`}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
