// Banc générique d'un bloc du renderer partagé (19 nov.). GATÉ : 404 en production.
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import BancBloc from "./BancBloc"

export const dynamic = "force-dynamic"

export default function E2EBloc() {
  if (!harnessAutorise()) notFound()
  return <Suspense><BancBloc /></Suspense>
}
