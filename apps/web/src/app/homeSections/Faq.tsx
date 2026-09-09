"use client"

import { useState } from "react"
import { useInView, Eyebrow } from "../homeUi"
import { FAQ_ITEMS } from "./faqData"

export function FAQSection() {
  const { ref, visible } = useInView(0.06)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  // 12 questions : les 6 premières visibles, les 6 autres derrière un seul bouton
  // (revue interne du 9 septembre — la FAQ faisait 1 370 px).
  const [toutes, setToutes] = useState(false)
  const VISIBLES = 6
  const items = toutes ? FAQ_ITEMS : FAQ_ITEMS.slice(0, VISIBLES)
  const cachees = FAQ_ITEMS.length - VISIBLES
  return (
    <section id="faq" ref={ref} aria-labelledby="faq-title"
      style={{ padding:"64px 48px", position:"relative", zIndex:1 }}>
      <style>{`
        .faq-item{ border-bottom:1px solid rgba(255,255,255,0.06); }
        .faq-item:first-child{ border-top:1px solid rgba(255,255,255,0.06); }
        .faq-btn{ width:100%; display:flex; align-items:center; justify-content:space-between;
          gap:20px; padding:14px 0; background:none; border:none; cursor:pointer;
          text-align:left; font-family:inherit; }
        .faq-btn:focus-visible{ outline:2px solid rgba(201,168,76,0.5); outline-offset:4px; border-radius:4px; }
        .faq-more{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; min-height:44px;
          margin-top:8px; background:none; border:none; border-bottom:1px solid rgba(255,255,255,0.06);
          color:#C9A84C; font-family:inherit; font-size:14px; font-weight:600; cursor:pointer; padding:12px 0; }
        .faq-more:hover{ color:#F5F0E8; }
        .faq-more:focus-visible{ outline:2px solid rgba(201,168,76,0.5); outline-offset:4px; border-radius:4px; }
        .faq-btn:hover .fq{ color:#F5F0E8 !important; }
        .faq-icon{ width:20px; height:20px; border-radius:50%;
          border:1px solid rgba(201,168,76,0.25); display:flex; align-items:center;
          justify-content:center; flex-shrink:0;
          transition:transform 0.3s ease, background 0.2s, border-color 0.2s; }
        .faq-ans{ overflow:hidden; transition:max-height 0.35s var(--mo-ease-emphasized), opacity 0.3s; }
        @media(max-width:640px){ #faq{ padding:56px 20px!important; } }
        @media(prefers-reduced-motion:reduce){ .faq-ans,.faq-icon{ transition:none !important; } }
      `}</style>
      <div style={{ maxWidth:800, margin:"0 auto 32px", textAlign:"center",
        opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)",
        transition:"opacity 0.6s ease,transform 0.6s ease" }}>
        <Eyebrow>FAQ</Eyebrow>
        <h2 id="faq-title" style={{ fontFamily:"Fraunces, serif",
          fontSize:"clamp(28px,3.4vw,44px)", color:"#F5F0E8", fontWeight:700,
          margin:"0 auto 16px", lineHeight:1.1, letterSpacing:"-0.02em" }}>
          Les questions{" "}<span style={{ color:"#C9A84C" }}>les plus fréquentes.</span>
        </h2>
        <p style={{ color:"rgba(188,182,166,0.8)", fontSize:16, lineHeight:1.65, margin:0 }}>
          Une question sans réponse ? Écrivez-nous, on est là.
        </p>
      </div>
      <div style={{ maxWidth:720, margin:"0 auto",
        opacity:visible?1:0, transition:"opacity 0.6s ease 0.15s" }}>
        <div id="faq-liste">
        {items.map((item, i) => {
          const isOpen = openIdx === i
          return (
            <div key={i} className="faq-item">
              <button className="faq-btn" onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen} aria-controls={"fa-" + i} id={"fb-" + i}>
                <span className="fq" style={{
                  color:isOpen?"#F5F0E8":"rgba(245,240,232,0.8)",
                  fontSize:15, fontWeight:isOpen?600:500, lineHeight:1.45,
                  transition:"color 0.2s" }}>{item.q}</span>
                <span className="faq-icon" aria-hidden="true" style={{
                  transform:isOpen?"rotate(45deg)":"rotate(0deg)",
                  background:isOpen?"rgba(201,168,76,0.12)":"transparent",
                  borderColor:isOpen?"rgba(201,168,76,0.5)":"rgba(201,168,76,0.25)" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="1" x2="5" y2="9" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="5" x2="9" y2="5" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>
              <div id={"fa-" + i} role="region" aria-labelledby={"fb-" + i}
                className="faq-ans"
                style={{ maxHeight:isOpen?"500px":"0px", opacity:isOpen?1:0 }}>
                <p style={{ color:"rgba(188,182,166,0.85)", fontSize:14.5,
                  lineHeight:1.75, margin:"0 0 20px", paddingRight:40 }}>{item.a}</p>
              </div>
            </div>
          )
        })}
        </div>
        {cachees > 0 && (
          <button type="button" className="faq-more" aria-expanded={toutes} aria-controls="faq-liste"
            onClick={() => setToutes(t => !t)}>
            {toutes ? "Réduire la liste" : `Voir les ${cachees} autres questions`}
            <span aria-hidden="true" style={{ display:"inline-block", transform: toutes ? "rotate(180deg)" : "none", transition:"transform 0.25s" }}>▾</span>
          </button>
        )}
        <div style={{ marginTop:28, textAlign:"center", paddingTop:0 }}>
          <p style={{ color:"rgba(188,182,166,0.7)", fontSize:14, marginBottom:16 }}>
            Vous avez une autre question ?
          </p>
          <a href="/contact" style={{ display:"inline-flex", alignItems:"center", gap:8,
            color:"#C9A84C", textDecoration:"none", fontSize:14, fontWeight:600,
            padding:"11px 24px", borderRadius:10,
            border:"1px solid rgba(201,168,76,0.3)", transition:"all 0.2s ease" }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background="rgba(201,168,76,0.08)";el.style.borderColor="rgba(201,168,76,0.55)"}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background="transparent";el.style.borderColor="rgba(201,168,76,0.3)"}}>
            Nous contacter <span style={{fontSize:15}}>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Transition entre sections : signature QRowg (glyphe QR doré + lignes) ───
