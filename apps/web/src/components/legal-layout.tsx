"use client"
import Link from "next/link"
import React from "react"

export function LegalLayout({ children, title, updated }: {
  children: React.ReactNode
  title: string
  updated: string
}) {
  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"DM Sans, sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; }
        body { background:var(--bg); }
        .ls { margin-bottom:48px; }
        .ls h2 { font-family:"Fraunces,serif"; font-size:22px; font-weight:700; color:var(--ink); margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid color-mix(in srgb, var(--accent) 15%, transparent); }
        .ls h3 { font-size:15px; font-weight:600; color:rgba(245,240,232,0.9); margin:24px 0 10px; }
        .ls p  { color:rgba(138,132,120,0.85); font-size:14.5px; line-height:1.8; margin-bottom:12px; }
        .ls ul { color:rgba(138,132,120,0.85); font-size:14.5px; line-height:1.8; padding-left:22px; margin-bottom:12px; }
        .ls ul li { margin-bottom:6px; }
        .ls a  { color:var(--accent); text-decoration:none; border-bottom:1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
        .ls a:hover { border-color:var(--accent); }
        .ls strong { color:rgba(245,240,232,0.8); font-weight:600; }
        .lph { display:inline-block; background:color-mix(in srgb, var(--accent) 10%, transparent); border:1px dashed color-mix(in srgb, var(--accent) 40%, transparent); border-radius:4px; padding:2px 8px; color:var(--accent); font-size:12px; font-style:italic; }
        @media(max-width:640px){ .lcontent{padding:96px 24px 60px !important;} .lheader{padding:0 24px !important;} .lfooter{padding:20px 24px !important; flex-direction:column !important;} }
      `}</style>
      <header style={{ position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(8,8,8,0.93)",backdropFilter:"blur(24px)",borderBottom:"1px solid color-mix(in srgb, var(--accent) 12%, transparent)",padding:"0 48px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between" }} className="lheader">
        <Link href="/" style={{ textDecoration:"none" }}>
          <span style={{ fontFamily:"Fraunces,serif",fontSize:20,color:"var(--accent)",fontWeight:700 }}>QRowg</span>
        </Link>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:6,color:"rgba(138,132,120,0.65)",textDecoration:"none",fontSize:13,transition:"color 0.2s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="var(--ink)"}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="rgba(138,132,120,0.65)"}}>
          ← Retour
        </Link>
      </header>
      <main style={{ maxWidth:740,margin:"0 auto",padding:"100px 48px 80px" }} className="lcontent">
        <div style={{ marginBottom:44,paddingBottom:32,borderBottom:"1px solid color-mix(in srgb, var(--accent) 12%, transparent)" }}>
          <p style={{ color:"var(--accent)",fontSize:10,letterSpacing:3,textTransform:"uppercase",fontWeight:600,marginBottom:12 }}>QRowg — Legal</p>
          <h1 style={{ fontFamily:"Fraunces,serif",fontSize:"clamp(28px,4vw,44px)",fontWeight:700,color:"var(--ink)",lineHeight:1.1,marginBottom:10 }}>{title}</h1>
          <p style={{ color:"rgba(138,132,120,0.5)",fontSize:12.5 }}>Dernière mise à jour : {updated}</p>
        </div>
        {children}
      </main>
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)",padding:"24px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }} className="lfooter">
        <p style={{ color:"rgba(138,132,120,0.4)",fontSize:12 }}>© 2026 QRowg.</p>
        <div style={{ display:"flex",gap:20 }}>
          {([["Confidentialité","/privacy"],["Conditions","/terms"],["Mentions légales","/legal"]] as const).map(([lbl,href])=>(
            <Link key={href} href={href} style={{ color:"rgba(138,132,120,0.45)",fontSize:12,textDecoration:"none",transition:"color 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="var(--accent)"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="rgba(138,132,120,0.45)"}}>
              {lbl}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
