// Aparece no lugar da estrela de favoritar: exibição temporária expira sozinha, então não pode ser favoritada.
// Mostra a validade como data e hora (e não "em X horas") para não depender do relógio durante a renderização.
function formatarValidade(expiraEm) {
  const data = expiraEm ? new Date(expiraEm) : null;
  if (!data || Number.isNaN(data.getTime())) return null;
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function SeloTemporaria({ expiraEm }) {
  const validade = formatarValidade(expiraEm);
  const descricao = validade
    ? `Exibição temporária: expira em ${validade} e não pode ser favoritada`
    : "Exibição temporária: expira sozinha e não pode ser favoritada";

  return (
    <span
      title={descricao}
      aria-label={descricao}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-borda-enfase px-2 py-0.5 text-xs font-bold whitespace-nowrap text-texto-forte"
    >
      Temporária
      {validade ? <span className="font-normal">· expira {validade}</span> : null}
    </span>
  );
}
