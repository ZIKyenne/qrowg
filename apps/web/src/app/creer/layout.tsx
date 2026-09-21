// La galerie de modèles s'appuie sur les notifications et les confirmations du
// tableau de bord. Servie ici, hors de son décor habituel, elle a besoin des mêmes
// fournisseurs — mais d'aucune barre latérale de compte.
//
// Un bandeau minimal remplace cette barre : sans lui, quelqu'un qui arrive depuis
// Google tombe sur une grille de modèles sans savoir chez qui il est, ni comment
// se connecter s'il a déjà un compte.
import Link from "next/link"
import QrowgLogo from "@/components/QrowgLogo"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"

export default function CreerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider><ConfirmProvider>
      <div style={{ minHeight: "100dvh", background: "#080808", display: "flex", flexDirection: "column" }}>
        <header className="qf-entete" style={{
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, padding: "14px clamp(16px, 4vw, 28px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <Link href="/" aria-label="QRowg — accueil" style={{ display: "inline-flex", textDecoration: "none" }}>
            <QrowgLogo size={22} />
          </Link>
          <Link href="/auth/login" style={{
            color: "#8A8478", textDecoration: "none", fontSize: 13, fontWeight: 600,
            padding: "7px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.09)",
            whiteSpace: "nowrap",
          }}>
            J'ai déjà un compte
          </Link>
        </header>
        {/* La galerie est le CONTENU de cette page : elle porte la région
            principale. À /dashboard/templates, c'est la coquille du tableau de
            bord qui la porte — d'où le choix de la poser ici et non dans la
            galerie elle-même, qui se retrouverait imbriquée (lot v158). */}
        <main style={{ flex: 1, minHeight: 0 }}>{children}</main>
      </div>
    </ConfirmProvider></ToastProvider>
  )
}
