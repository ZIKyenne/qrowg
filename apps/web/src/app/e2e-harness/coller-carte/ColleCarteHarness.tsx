"use client"
import { ToastProvider } from "@/components/Toast"
import ColleClient from "@/app/dashboard/pages/[id]/carte/coller/ColleClient"

export default function ColleCarteHarness({ refus }: { refus: boolean }) {
  // L'import simulé garde ce qu'il reçoit, lisible par le test (window.__carteImportee).
  const importer = async (pageId: string, titre: string, sections: unknown) => {
    await new Promise(r => setTimeout(r, 150))
    ;(window as any).__carteImportee = { pageId, titre, sections }
    return refus ? { ok: false, phrase: "Le serveur a refusé (banc d'essai)." } : { ok: true }
  }
  return <ToastProvider><ColleClient page={{ id: "00000000-0000-4000-8000-000000000001", title: "Red Fish (démo)", slug: "red-fish-demo" }} importer={importer} /></ToastProvider>
}
