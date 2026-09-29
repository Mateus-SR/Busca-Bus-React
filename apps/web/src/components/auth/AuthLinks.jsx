import Link from "next/link";

export default function AuthLinks({ href, children }) {
  return (
    <Link href={href} className="mx-auto rounded-md bg-red-600 px-6 py-2 text-lg font-semibold text-white transition hover:bg-red-700">
      {children}
    </Link>
  );
}
