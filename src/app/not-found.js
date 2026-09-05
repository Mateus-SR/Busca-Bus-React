import Link from "next/link";
import InfoCard from "@/components/ui/InfoCard";

export default function NotFound() {
    return (
        <main className="flex min-h-screen w-full">
            <div className="bg-sptrans flex flex-col flex-1 items-center justify-center text-center p-16 max-w-1/2">
                <h1 className="font-extrabold text-3xl text-white mb-3">
                    Ops! Essa página não foi encontrada
                </h1>
                <p className="text-white font-bold mb-6">
                    O endereço que você tentou acessar não existe.
                    <br/>
                    Verifique se digitou corretamente o código da exibição e tente novamente.
                </p>
                <Link
                    href="/"
                    className="bg-white text-black text-xl font-bold px-8 py-3 rounded-2xl hover:bg-white/80 transition-all duration-200 ease-out"
                >
                    Voltar para o início
                </Link>
                <InfoCard titulo="Detalhes técnicos" icone="teste">
                    
                </InfoCard>
            </div>

            <div className="bg-white font-extrabold text-3xl text-black flex flex-col flex-1 items-center justify-center text-center p-16 max-w-1/2">
                Placeholder
            </div>
        </main>
    );
}