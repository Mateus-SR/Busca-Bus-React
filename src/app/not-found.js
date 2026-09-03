import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex min-h-screen w-full">
            <div className="bg-sptrans font-extrabold text-3xl text-white flex-1">
                <span>
                    Ops!
                    Essa página não foi encontrada
                </span>
            </div>
            <div className="bg-white flex-1">
                teste
            </div>
        </main>
    );
}