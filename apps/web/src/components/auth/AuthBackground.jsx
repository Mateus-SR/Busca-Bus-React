export default function AuthBackground({ children, largura = "max-w-4xl" }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 font-inter">
      <div className="absolute inset-0 z-0 bg-[url(/img/Onibus.jpg)] bg-cover bg-center opacity-60 blur-[4px] contraste:hidden" />
      <div className="absolute inset-0 z-0 bg-black/40 contraste:hidden" />
      <div className={`relative z-20 w-full ${largura} rounded-xl border border-borda bg-superficie p-6 shadow-2xl shadow-black/60 sm:p-10`}>
        {children}
      </div>
    </main>
  );
}
