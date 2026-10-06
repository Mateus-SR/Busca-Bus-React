import packageJson from "../../../package.json"; // Ajuste o caminho conforme a localização do seu Footer

export default function Footer() {
  return (
    <footer className="py-4 text-center text-sm text-gray-500">
      BuscaBus • Versão {packageJson.version}
    </footer>
  );
}
