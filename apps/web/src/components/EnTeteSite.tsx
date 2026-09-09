"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import QrowgLogo from "@/components/QrowgLogo"

// En-tête du site public : le même sur l'accueil et sur Fonctionnalités
// (revue interne du 9 septembre — Fonctionnalités n'avait que Tarifs et Connexion).
// `page` dit où l'on est : sur l'accueil les entrées sont des ancres de la page ;
// ailleurs elles renvoient vers l'accueil, et l'entrée de la page courante est
// marquée `aria-current`.

const NAV_LINKS = [
  { label: "Fonctionnalités", id: "features"  },
  { label: "Modèles",         id: "templates" },
  { label: "Exemples",        id: "examples"  },
  { label: "Tarifs",          id: "pricing"   },
  { label: "FAQ",             id: "faq"       },
]

export default function EnTeteSite({ page = "accueil" }: { page?: "accueil" | "features" }) {
  const accueil = page === "accueil"
  const hrefDe = (id: string) => (page === "features" && id === "features") ? "/features" : accueil ? `#${id}` : `/#${id}`

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active,   setActive]   = useState("")
  const [authed,   setAuthed]   = useState(false)
  useEffect(() => {
    // Header conscient de la connexion : un utilisateur connecté voit « Mon espace »
    // au lieu de « Connexion / Commencer » (sinon il croit être anonyme).
    createClient().auth.getUser().then(({ data }) => setAuthed(!!data.user)).catch(() => {})
  }, [])
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])
  useEffect(() => {
    if (!accueil) return
    const ids = NAV_LINKS.map(l => l.id)
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: "-40% 0px -55% 0px" }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [accueil])
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])
  return (
    <>
      <style>{`
        .nl::after{content:"";position:absolute;bottom:-2px;left:0;right:0;height:1.5px;
          background:var(--accent);transform:scaleX(0);
          transform-origin:left;transition:transform 0.25s ease;border-radius:2px;}
        .nl:hover::after,.nl.act::after{transform:scaleX(1);}
        .nl:hover{color:var(--ink) !important;}
        .nl:focus-visible,.nct:focus-visible{outline:2px solid rgba(201,168,76,0.6);outline-offset:4px;border-radius:4px;}
        .ml{display:block;color:var(--muted);text-decoration:none;font-size:18px;padding:16px 0;
          border-bottom:1px solid rgba(201,168,76,0.08);transition:color 0.2s;}
        .ml:hover,.ml.act{color:var(--ink);}
        @keyframes slideMenu{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:900px){.dNav{display:none !important;}.brg{display:flex !important;}}
        @media(min-width:901px){.brg{display:none !important;}#mobileMenu{display:none !important;}}
        @media(max-width:640px){.navWrap{padding:env(safe-area-inset-top) 20px 0 !important;}}
        @media(prefers-reduced-motion:reduce){.nl::after{transition:none;}}
      `}</style>
      <nav aria-label="Navigation principale" className="navWrap qf-entete" style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"env(safe-area-inset-top) 48px 0",height:"calc(68px + env(safe-area-inset-top))",
        background:scrolled?"rgba(8,8,8,0.97)":"rgba(8,8,8,0.9)",
        backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
        borderBottom:scrolled?"1px solid rgba(201,168,76,0.2)":"1px solid rgba(201,168,76,0.07)",
        boxShadow:scrolled?"0 4px 32px rgba(0,0,0,0.5)":"none",
        transition:"background 0.3s,border-color 0.3s,box-shadow 0.3s",
      }}>
        <Link href="/" aria-label="QRowg — accueil" style={{textDecoration:"none",display:"inline-flex",transition:"transform 0.2s var(--mo-ease-spring)"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1.04)"}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none"}}>
          <QrowgLogo size={22} />
        </Link>
        <div className="dNav" role="menubar" style={{display:"flex",alignItems:"center",gap:32}}>
          {NAV_LINKS.map(({label,id})=>{
            const href=hrefDe(id); const isAct=accueil ? active===id : page===id
            return(<Link key={id} href={href} role="menuitem" aria-current={isAct?"page":undefined}
              className={"nl"+(isAct?" act":"")}
              style={{color:isAct?"var(--ink)":"var(--muted)",textDecoration:"none",fontSize:14,
                fontWeight:isAct?600:400,position:"relative",paddingBottom:2,transition:"color 0.2s"}}>{label}</Link>)
          })}
        </div>
        <div className="dNav" style={{display:"flex",alignItems:"center",gap:16}}>
          {authed ? (
            <Link href="/dashboard" className="nct" style={{
              background:"var(--accent)",color:"var(--ink-on-accent)",
              textDecoration:"none",fontSize:14,fontWeight:700,padding:"9px 22px",borderRadius:10,
              display:"inline-block",boxShadow:"none",
              transition:"transform 0.2s var(--mo-ease-spring),box-shadow 0.2s",
            }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="translateY(-2px) scale(1.03)";el.style.opacity="0.92"}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="none";el.style.boxShadow="0 2px 16px rgba(201,168,76,0.3)"}}>
              Mon espace →
            </Link>
          ) : (<>
            <Link href="/auth/login" className="nl"
              style={{color:"var(--muted)",textDecoration:"none",fontSize:14,position:"relative",paddingBottom:2,transition:"color 0.2s"}}>Connexion</Link>
            <Link href="/creer" className="nct" style={{
              background:"var(--accent)",color:"var(--ink-on-accent)",
              textDecoration:"none",fontSize:14,fontWeight:700,padding:"9px 22px",borderRadius:10,
              display:"inline-block",boxShadow:"none",
              transition:"transform 0.2s var(--mo-ease-spring),box-shadow 0.2s",
            }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="translateY(-2px) scale(1.03)";el.style.opacity="0.92"}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="none";el.style.boxShadow="0 2px 16px rgba(201,168,76,0.3)"}}>
              Composer ma page
            </Link>
          </>)}
        </div>
        {/* Burger — sibling direct de <nav> (hors .dNav, sinon masqué par display:none parent en mobile) */}
        <button onClick={()=>setMenuOpen(o=>!o)} aria-label={menuOpen?"Fermer le menu":"Ouvrir le menu"}
          aria-expanded={menuOpen} aria-controls="mobileMenu" className="brg"
          style={{display:"none",background:menuOpen?"rgba(201,168,76,0.14)":"rgba(255,255,255,0.05)",
            border:"1px solid rgba(201,168,76,0.28)",borderRadius:11,cursor:"pointer",
            width:44,height:44,flexDirection:"column",gap:5,alignItems:"center",justifyContent:"center",
            transition:"background 0.2s,border-color 0.2s"}}>
          {[
            {tf:menuOpen?"rotate(45deg) translate(5px,5px)":"none",op:1},
            {tf:"none",op:menuOpen?0:1},
            {tf:menuOpen?"rotate(-45deg) translate(5px,-5px)":"none",op:1},
          ].map((s,i)=>(
            <span key={i} style={{display:"block",width:22,height:2,background:"var(--accent)",
              borderRadius:2,transform:s.tf,opacity:s.op,transition:"transform 0.25s,opacity 0.2s"}}/>
          ))}
        </button>
      </nav>
      {menuOpen&&(
        <div id="mobileMenu" role="dialog" aria-label="Menu mobile" style={{
          position:"fixed",top:"calc(68px + env(safe-area-inset-top))",left:0,right:0,bottom:0,zIndex:199,
          background:"rgba(8,8,8,0.97)",backdropFilter:"blur(20px)",
          padding:"32px",display:"flex",flexDirection:"column",
          animation:"slideMenu 0.25s ease",overflowY:"auto",
        }}>
          {NAV_LINKS.map(({label,id})=>(
            <Link key={id} href={hrefDe(id)}
              className={"ml"+((accueil ? active===id : page===id)?" act":"")}
              onClick={()=>setMenuOpen(false)}>{label}</Link>
          ))}
          <div style={{marginTop:32,display:"flex",flexDirection:"column",gap:12}}>
            {authed ? (
              <Link href="/dashboard" onClick={()=>setMenuOpen(false)} style={{
                display:"block",textAlign:"center",
                background:"var(--accent)",
                color:"var(--ink-on-accent)",textDecoration:"none",fontSize:16,fontWeight:700,
                padding:"16px",borderRadius:12}}>
                Mon espace →</Link>
            ) : (<>
              <Link href="/auth/login" onClick={()=>setMenuOpen(false)} style={{
                display:"block",textAlign:"center",color:"var(--muted)",textDecoration:"none",
                fontSize:16,padding:"14px",border:"1px solid rgba(201,168,76,0.15)",borderRadius:12}}>Connexion</Link>
              <Link href="/creer" onClick={()=>setMenuOpen(false)} style={{
                display:"block",textAlign:"center",
                background:"var(--accent)",
                color:"var(--ink-on-accent)",textDecoration:"none",fontSize:16,fontWeight:700,
                padding:"16px",borderRadius:12}}>
                Composer ma page →</Link>
            </>)}
          </div>
        </div>
      )}
    </>
  )
}

