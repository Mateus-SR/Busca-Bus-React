import Link from "next/link";

export default function AuthLinks({ href, children, className = "" }) {
  return (
    <Link
      href={href}
      className={`text-sm text-black underline-offset-2 transition hover:text-red-600 hover:underline ${className}`}
    >
      {children}
    </Link>
  );
}
