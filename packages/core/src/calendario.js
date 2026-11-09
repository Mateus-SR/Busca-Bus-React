//As cores existem em CORES_EVENTO (apps/web/src/utils/calendario.js).
export const TIPOS_EVENTO = [
  { valor: "Palestra", cor: "azul" },
  { valor: "Workshop", cor: "verde" },
  { valor: "Hackathon", cor: "roxo" },
  { valor: "Encontro", cor: "laranja" },
  { valor: "Aula", cor: "turquesa" },
  { valor: "Evento", cor: "vermelho" },
];

export const LOCAIS_EVENTO = [
  "Auditório",
  "Biblioteca",
  "Laboratório",
  "Sala de aula",
  "Quadra",
  "Pátio",
  "Online",
];

export const LOCAIS_COM_NUMERO = ["Laboratório", "Sala de aula"];

export const ROLES_ADMIN = ["admin"];

export const ehAdmin = (role) => ROLES_ADMIN.includes(String(role ?? "").trim().toLowerCase());