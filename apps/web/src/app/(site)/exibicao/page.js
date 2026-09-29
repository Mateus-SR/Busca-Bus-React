import AcessoRapidoForm from "@/components/home/AcessoRapidoForm";

export default function ExibicaoIndexPage() {
  return <main className="flex min-h-[calc(100vh-68px)] flex-col items-center justify-center"><h1 className="text-center text-3xl font-bold">Acessar exibição</h1><p className="mt-3 text-center text-gray-600">Informe o código de seis caracteres para continuar.</p><AcessoRapidoForm /></main>;
}
