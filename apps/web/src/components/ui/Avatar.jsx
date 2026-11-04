const AVATAR_PADRAO = "avatar-01";

export default function Avatar({ avatarId = AVATAR_PADRAO, alt = "", className = "" }) {
  const id = /^avatar-\d{2}$/.test(avatarId) ? avatarId : AVATAR_PADRAO;

  return (
    <img
      src={`/avatars/${id}.svg`}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
