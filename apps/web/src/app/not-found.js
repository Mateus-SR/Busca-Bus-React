import Link from "next/link";
import InfoCard from "@/components/ui/InfoCard";

export default function NotFound() {
    return (
        <main className="flex min-h-screen w-full">
            <div className="bg-marca flex flex-col flex-1 items-center justify-center text-center p-16 max-w-1/2">
                <h1 className="font-extrabold text-3xl text-sobre-marca mb-2 italic">
                    Ops! Essa página não foi encontrada.
                </h1>
                <p className="text-sobre-marca font-bold mb-6">
                    O endereço que você tentou acessar não existe.
                    <br/>
                    Se está tentando acessar uma exibição, verifique o código inserido e tente novamente.
                </p>
                <Link
                    href="/"
                    className="bg-superficie text-texto text-xl font-bold px-8 py-3 rounded-2xl hover:bg-superficie/80 transition-all duration-200 ease-out"
                >
                    Voltar para o início
                </Link>
                {/* <InfoCard titulo="Detalhes técnicos">
                    
                </InfoCard> */}
            </div>

            <div className="bg-superficie font-extrabold text-3xl text-texto flex flex-col flex-1 items-center justify-center text-center p-16 max-w-1/2">
                Placeholder
            </div>
        </main>
    );
}