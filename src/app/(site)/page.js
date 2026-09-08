import AcessoRapidoForm from '@/components/home/AcessoRapidoForm';

export default function Home() {
  return (
    <main>
      <section
        className="from-sptrans/12 font-inter flex bg-linear-to-b to-transparent to-40% py-10"
        id="inicio"
      >
        <div className="mx-auto grid w-full max-w-300 grid-cols-1 gap-7">
          <div>
            <div className="text-sptrans text-sm font-bold tracking-[0.18em] uppercase">
              Transporte urbano
            </div>
            <h1 className="mx-0 mt-2.5 mb-3 text-4xl leading-tight font-extrabold">
              Monitoramento de <br />
              ônibus <span className="text-sptrans">em tempo real</span>
            </h1>
            <p className="max-w-prose text-base text-black">
              Acompanhe a posição de veículos, horários previstos e atrasos
            </p>
          </div>
        </div>
      </section>

      <AcessoRapidoForm />
    </main>
  );
}
