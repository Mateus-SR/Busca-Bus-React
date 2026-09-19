export default function AuthBackground({ children, largura = "max-w-4xl" }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 font-inter">
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-60 blur-[4px]" style={{ backgroundImage: "url('/img/Onibus.jpg')" }} />
      <div className="absolute inset-0 z-0 bg-black/40" />
      <div className={`relative z-20 w-full ${largura} rounded-xl border border-gray-300 bg-white p-6 shadow-2xl shadow-black/60 sm:p-10`}>
        {children}
      </div>
    </main>
  );
}
