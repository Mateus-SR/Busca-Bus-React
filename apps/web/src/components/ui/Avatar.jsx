
import { UserRound } from "lucide-react";

const AVATARES_PERMITIDOS = new Set([
  "avatar-02",
  "avatar-05",
  "avatar-06",
  "avatar-07",
  "avatar-11",
  "avatar-13",
]);

export default function Avatar({ avatarId = null, alt = "", className = "" }) {
  const id = typeof avatarId === "string" && AVATARES_PERMITIDOS.has(avatarId)
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
      src={`/avatars/${id}.png`}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
