import packageJson from "../../../package.json"; // Ajuste o caminho conforme a localização do seu Footer

export default function Footer({ fixo = false }) {
  return (
    <footer className={`${fixo ? "fixed inset-x-0 bottom-0 z-50 bg-sptrans py-1 text-white" : "py-4 text-gray-500"} text-center text-sm`}>
      BuscaBus • Versão {packageJson.version}
    </footer>
  );
}
