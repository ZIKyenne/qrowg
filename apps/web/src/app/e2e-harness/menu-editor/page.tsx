// Route de harness E2E — éditeur du bloc Menu (import tableur + prompt IA). GATÉE 404 en production.
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { MenuEditorHarness } from "./MenuEditorHarness"

export const dynamic = "force-dynamic"

export default function E2EMenuEditorPage() {
  if (!harnessAutorise()) notFound()
  return <Suspense><MenuEditorHarness /></Suspense>
}
