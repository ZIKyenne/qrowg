import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { estAdministrateur } from "@/lib/admin"
import CroissanceClient from "./CroissanceClient"

export const metadata = { title: "Croissance — QRowg" }

/**
 * Outillage interne du moteur de croissance.
 *
 * `notFound()` plutôt qu'un message « réservé aux administrateurs » : un client
 * connecté n'a pas à apprendre qu'un écran d'administration existe à cette
 * adresse. C'est le même choix que pour les bancs d'essai et pour les aperçus
 * privés — un refus qui ne distingue pas « interdit » de « inexistant ».
 *
 * `ADMIN_EMAILS` vide ⇒ personne, y compris nous. Le défaut est fermé.
 */
export default async function CroissanceServerPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  if (!estAdministrateur(user.email)) notFound()

  return <CroissanceClient />
}
