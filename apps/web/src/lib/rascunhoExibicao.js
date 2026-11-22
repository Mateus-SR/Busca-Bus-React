// Rascunho do formulário de exibição: guardado só na aba (sessionStorage) enquanto a pessoa escolhe pontos no mapa,
// para o que ela já digitou não se perder na ida e volta. O token da SPTrans nunca entra aqui.
const CHAVE = "busca-bus:rascunho-exibicao";

export function salvarRascunho(dados) {
  try {
    window.sessionStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // Sem storage (aba privada, bloqueio): o formulário só volta sem o rascunho.
  }
}

export function lerRascunho() {
  try {
    const texto = window.sessionStorage.getItem(CHAVE);
    const dados = texto ? JSON.parse(texto) : null;
    return dados && typeof dados === "object" ? dados : null;
  } catch {
    return null;
  }
}

export function limparRascunho() {
  try {
    window.sessionStorage.removeItem(CHAVE);
  } catch {
    // Nada a limpar.
  }
}
