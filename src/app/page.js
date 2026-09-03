import AcessoRapidoForm from "@/components/home/AcessoRapidoForm";

export default function Home() {
  return (
    <main>
      <section className="py-10 flex bg-linear-to-b from-sptrans/8 to-transparent to-40% font-inter" id="inicio">
      <div className="max-w-300 w-full mx-auto grid grid-cols-1 gap-7">
          <div>
          <div className="text-sptrans font-bold tracking-[0.18em] uppercase text-sm">
            Transporte urbano
          </div>
            <h1 className="mx-0 mt-2.5 mb-3 font-extrabold text-4xl leading-tight">
              Monitoramento de <br/>
              ônibus <span className="text-sptrans">em tempo real</span>
            </h1>
            <p className="text-black text-base max-w-prose">
              Acompanhe a posição de veículos, horários previstos e atrasos
            </p>
          </div>
        </div>
      </section>

      <AcessoRapidoForm/>
    </main>
  );
}