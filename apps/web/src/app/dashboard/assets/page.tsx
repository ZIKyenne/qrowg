"use client"

import { useEffect, useState } from "react"
import { Images, FileText, Upload, Trash2, Link2, Check, ExternalLink } from "lucide-react"
import { useImageUpload } from "../builder/useImageUpload"

const G = "#C9A84C"
const MUTED = "#A8A190"

type Asset = { name: string; url: string }

// Nom lisible depuis un nom stocké "docs-mon-menu-1699999999.pdf" -> "mon-menu.pdf".
function pretty(name: string): string {
  const ext = name.includes(".") ? "." + name.split(".").pop() : ""
  return name.replace(/\.[^.]+$/, "").replace(/^(docs|blocks)-/, "").replace(/-\d{10,}$/, "") + ext
}

export default function AssetsPage() {
  const { uploadImage, uploadFile, listAssets, deleteAsset, uploading } = useImageUpload()
  const [tab, setTab] = useState<"image" | "file">("image")
  const [images, setImages] = useState<Asset[] | null>(null)
  const [files, setFiles] = useState<Asset[] | null>(null)
  const [copied, setCopied] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState("")
  const [dragOver, setDragOver] = useState(false)

  // Fonction simple (pas de useCallback) : listAssets a une identité instable, la mémoïser
  // ferait boucler l'effet. On charge au montage + après chaque upload/suppression.
  async function load() {
    const [imgs, fls] = await Promise.all([listAssets("image"), listAssets("file")])
    setImages(imgs); setFiles(fls)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  const q = query.trim().toLowerCase()
  const assets = (tab === "image" ? images : files)?.filter(a => !q || pretty(a.name).toLowerCase().includes(q)) ?? null

  async function onUploadFiles(list: File[]) {
    if (!list.length) return
    setBusy(true)
    for (const file of list) {
      if (file.type.startsWith("image/")) await uploadImage(file, "blocks")
      else await uploadFile(file, "docs")
    }
    await load(); setBusy(false)
  }
  async function onDelete(a: Asset) {
    if (!window.confirm(`Supprimer « ${pretty(a.name)} » ?\n\nSi ce média est utilisé sur une page publiée, il n'y apparaîtra plus.`)) return
    setBusy(true); const ok = await deleteAsset(a.name); if (ok) await load(); setBusy(false)
  }
  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(""), 1500) } catch {}
  }

  const total = (images?.length || 0) + (files?.length || 0)

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!dragOver) setDragOver(true) }}
      onDragLeave={e => { if (e.currentTarget === e.target) setDragOver(false) }}
      onDrop={e => { e.preventDefault(); setDragOver(false); onUploadFiles(Array.from(e.dataTransfer.files || [])) }}
      style={{ padding: "clamp(16px, 4vw, 34px)", maxWidth: 1100, margin: "0 auto", position: "relative" }}>
      {/* Sur appareil tactile (pas de survol), les actions sur images doivent rester visibles et assez grandes */}
      <style>{`@media (hover: none) { .ov { opacity: 1 !important } .ov > button, .ov > a { width: 40px !important; height: 40px !important } }`}</style>
      {dragOver && (
        <div style={{ position: "absolute", inset: 12, zIndex: 20, background: "rgba(201,168,76,0.08)", border: `2px dashed ${G}`, borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, pointerEvents: "none" }}>
          <Upload size={28} color={G} />
          <p style={{ color: G, fontSize: 15, fontWeight: 700, margin: 0 }}>Déposez vos fichiers pour les importer</p>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ color: "#F5F0E8", fontSize: 24, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
            <Images size={22} color={G} /> Médias
          </h1>
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Toutes vos images et fichiers, réutilisables sur toutes vos pages. {total > 0 ? `${total} média${total > 1 ? "s" : ""}.` : ""}</p>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, background: G, color: "#080808", fontSize: 13, fontWeight: 700, borderRadius: 10, padding: "10px 16px", cursor: uploading || busy ? "default" : "pointer", opacity: uploading || busy ? 0.6 : 1 }}>
          <Upload size={15} /> {uploading || busy ? "En cours…" : "Importer"}
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv" style={{ display: "none" }}
            disabled={uploading || busy}
            onChange={e => { onUploadFiles(Array.from(e.target.files || [])); e.target.value = "" }} />
        </label>
      </div>

      {/* Onglets + recherche */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 11, padding: 4, width: "fit-content" }}>
          {([["image", "Images", images?.length], ["file", "Fichiers", files?.length]] as const).map(([k, l, n]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === k ? G : "transparent", color: tab === k ? "#080808" : MUTED, fontSize: 13, fontWeight: tab === k ? 700 : 500 }}>
              {k === "image" ? <Images size={14} /> : <FileText size={14} />}{l}{typeof n === "number" ? ` · ${n}` : ""}
            </button>
          ))}
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Rechercher un média…"
          style={{ flex: 1, minWidth: 180, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 13px", color: "#F5F0E8", fontSize: 13, outline: "none" }} />
      </div>

      {assets === null ? (
        <p style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "50px 0" }}>Chargement…</p>
      ) : assets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 0", border: "2px dashed rgba(201,168,76,0.15)", borderRadius: 16 }}>
          <p style={{ fontSize: 34, margin: "0 0 8px" }}>{q ? "🔍" : tab === "image" ? "🖼️" : "📄"}</p>
          <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{q ? "Aucun média ne correspond" : `Aucun ${tab === "image" ? "média image" : "fichier"} pour l'instant`}</p>
          <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{q ? `Aucun résultat pour « ${query.trim()} ».` : "Cliquez sur « Importer » ou glissez-déposez vos fichiers ici."}</p>
        </div>
      ) : tab === "image" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {assets.map(a => (
            <div key={a.url} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0A0A0A", aspectRatio: "1" }}
              onMouseEnter={e => { const o = e.currentTarget.querySelector(".ov") as HTMLElement; if (o) o.style.opacity = "1" }}
              onMouseLeave={e => { const o = e.currentTarget.querySelector(".ov") as HTMLElement; if (o) o.style.opacity = "0" }}>
              <img src={a.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div className="ov" style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.7), transparent 55%)", opacity: 0, transition: "opacity .15s", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 6, padding: 8 }}>
                <button onClick={() => copy(a.url)} title="Copier le lien" style={btn}>{copied === a.url ? <Check size={13} color="#39FF8F" /> : <Link2 size={13} />}</button>
                <a href={a.url} target="_blank" rel="noopener noreferrer" title="Ouvrir" style={btn}><ExternalLink size={13} /></a>
                <button onClick={() => onDelete(a)} title="Supprimer" style={{ ...btn, color: "#FF6B6B" }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {assets.map(a => (
            <div key={a.url} style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "11px 14px" }}>
              <FileText size={17} color={G} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, color: "#F5F0E8", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pretty(a.name)}</span>
              <button onClick={() => copy(a.url)} title="Copier le lien" style={rowBtn}>{copied === a.url ? <Check size={14} color="#39FF8F" /> : <Link2 size={14} />}</button>
              <a href={a.url} target="_blank" rel="noopener noreferrer" title="Ouvrir" style={rowBtn}><ExternalLink size={14} /></a>
              <button onClick={() => onDelete(a)} title="Supprimer" style={{ ...rowBtn, color: "#FF6B6B" }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const btn: any = { width: 30, height: 30, borderRadius: 8, background: "rgba(8,8,8,0.85)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F0E8" }
const rowBtn: any = { width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED, flexShrink: 0, textDecoration: "none" }
