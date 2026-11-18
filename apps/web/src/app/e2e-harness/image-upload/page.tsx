// Banc du sélecteur d'image (lot 6 « appli », 18 nov.) : le champ image de
// l'éditeur, monté seul, sans session. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import BancImageUpload from "./BancImageUpload"

export const dynamic = "force-dynamic"

export default function E2EImageUpload() {
  if (!harnessAutorise()) notFound()
  return <ToastProvider><ConfirmProvider><BancImageUpload /></ConfirmProvider></ToastProvider>
}
