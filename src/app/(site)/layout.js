// src/app/(site)/layout.js — com Header
import Header from "@/components/layout/Header";
import HeaderChrome from "@/components/layout/HeaderHider";
import { PainelHeaderProvider } from "@/contexts/PainelHeaderContext";

export default function SiteLayout({ children }) {
  return (
    <PainelHeaderProvider>
      <HeaderChrome header={<Header />} />
      {children}
    </PainelHeaderProvider>
  );
}