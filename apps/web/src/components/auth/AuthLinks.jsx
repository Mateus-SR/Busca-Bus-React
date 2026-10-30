import Link from "next/link";

export default function AuthLinks({ href, children, className = "" }) {
  return (
    <Link
      href={href}
      className={`text-sm text-texto underline-offset-2 transition hover:text-destaque hover:underline ${className}`}
    >
      {children}
    </Link>
  );
}
