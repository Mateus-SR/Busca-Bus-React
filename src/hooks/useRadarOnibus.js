"use client";

import { useEffect, useState } from "react";

export default function useRadarOnibus(onibusIniciais = []) {
  const [onibus, setOnibus] = useState(onibusIniciais);
  useEffect(() => {
    const intervalo = setInterval(() => setOnibus((atuais) => atuais.map((item) => ({ ...item }))), 5000);
    return () => clearInterval(intervalo);
  }, []);
  return { onibus, carregando: false, erro: null };
}
