"use client"

import Vignette from "@/components/Vignette"
import { Button } from "@/components/ui/Button"
import { useRef, useState, useEffect } from "react"
import { Upload, X, Image as ImageIcon, FolderOpen, Trash2, Plus, Search, Star } from "lucide-react"
import { useImageUpload } from "./useImageUpload"
import { messageEnvoi } from "./validationEnvoi"
import { useConfirm } from "@/components/ui/Confirm"
import { phraseSuppressionMedia } from "@/lib/mediaUtilise"
import { lireBibliotheque, usagesDuMedia } from "../assets/usagesDesMedias"
import { createClient } from "@/lib/supabase/client"
import ImageCropModal from "./ImageCropModal"
import { correspond } from "@/lib/rechercheSouple"
import { ecrireJson, lireJson } from "@/lib/memoireDuNavigateur"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { useFermetureModale, carteCliquable } from "@/lib/useFermetureModale"
import { ActionSheet } from "@/components/mobile/ActionSheet"

type Props = {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
  cropAspect?: string   // ratio présélectionné dans le recadrage (ex : "wide" bannière, "square" avatar)
}

export default function ImageUpload({ value, onChange, label, hint, cropAspect }: Props) {
  const { envoyerImage, uploading, listAssets, deleteAsset } = useImageUpload()
  const confirm = useConfirm()
  const inputRef = useRef<HTMLInputElement>(null)
  const libInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const [libOpen, setLibOpen] = useState(false)
  const [libAssets, setLibAssets] = useState<{ name: string; url: string }[] | null>(null)
  const [libBusy, setLibBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false) // #05 : bottom sheet de choix de source
  // Échap ferme ce qui se ferme en cliquant à côté (lot v139).
  useFermetureModale(libOpen, () => setLibOpen(false))
  const [libQuery, setLibQuery] = useState("") // #07 : recherche dans la bibliotheque
  // Recadrage avant upload : toute image sélectionnée passe par la modale de recadrage (pan/zoom/ratio).
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropDest, setCropDest] = useState<"block" | "lib">("block")
  // #07 : favoris (persistes par URL). Les images favorites remontent en tete.
  // Defaut vide (= SSR) puis lecture apres montage -> pas de mismatch d'hydratation (cf review #2).
  const [favs, setFavs] = useState<Set<string>>(new Set())
  useEffect(() => { const s = lireJson<string[]>("qrfolio_media_favs", []); if (Array.isArray(s) && s.length) setFavs(new Set(s)) }, [])
  const toggleFav = (url: string) => setFavs(prev => { const n = new Set(prev); if (n.has(url)) n.delete(url); else n.add(url); ecrireJson("qrfolio_media_favs", [...n]); return n })

  async function openLibrary() {
    setLibOpen(true)
    if (libAssets === null) setLibAssets(await listAssets().catch(() => []))
  }
  async function refreshLibrary() { setLibAssets(await listAssets().catch(() => [])) }

  // Upload depuis la modale : ajoute à la bibliothèque puis rafraîchit (l'utilisateur clique pour choisir).
  function handleLibFile(file: File) {
    setError("")
    if (!file.type.startsWith("image/")) { setError("Fichier invalide — image uniquement"); return }
    if (file.size > 5 * 1024 * 1024) { setError("Fichier trop lourd — max 5MB"); return }
    setCropDest("lib"); setCropFile(file) // recadrage puis ajout à la bibliothèque
  }
  async function removeAsset(a: { name: string; url: string }) {
    // « Si elle est utilisée… » : le produit peut regarder (lot v97).
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const biblio = user ? await lireBibliotheque(supabase as any, user.id) : null
    const message = phraseSuppressionMedia(a.name, usagesDuMedia(biblio, a.name))
    if (!(await confirm({ title: "Supprimer cette image ?", message, confirmLabel: "Supprimer", danger: true }))) return
    setLibBusy(true)
    const ok = await deleteAsset(a.name)
    if (ok) { if (value === a.url) onChange(""); await refreshLibrary() }
    setLibBusy(false)
  }

  function handleFile(file: File) {
    setError("")
    if (!file.type.startsWith("image/")) { setError("Fichier invalide — image uniquement"); return }
    if (file.size > 5 * 1024 * 1024) { setError("Fichier trop lourd — max 5MB"); return }
    setCropDest("block"); setCropFile(file) // recadrage puis upload + sélection
  }

  // Recadrage confirmé → upload du blob recadré (JPEG/PNG), plus léger que l'original.
  async function onCropConfirm(blob: Blob) {
    const src = cropFile
    setCropFile(null)
    if (!src) return
    const type = blob.type || src.type
    const ext = type === "image/png" ? ".png" : ".jpg"
    const named = new File([blob], (src.name.replace(/\.[^.]+$/, "") || "image") + ext, { type })
    // La raison arrive AVEC le résultat : plus de message d'un rendu en retard.
    if (cropDest === "lib") {
      setLibBusy(true)
      const r = await envoyerImage(named, "blocks")
      if (r.url) await refreshLibrary()
      else if (r.raison) setError(messageEnvoi(r.raison, "photo"))
      setLibBusy(false)
    } else {
      const r = await envoyerImage(named, "blocks")
      if (r.url) onChange(r.url)
      else if (r.raison) setError(messageEnvoi(r.raison, "photo"))
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const G = "#C9A84C"
  const MUTED = "var(--muted)"

  return (
    <div>
      {label && <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 500 }}>{label}</label>}

      {value ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
          <Vignette src={value} alt="" sizes="300px" style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
          {/* La pastille reste de 28 px ; la CIBLE fait 44 (lot 7 « appli ») —
              le doigt vise la zone, l'œil voit la pastille. */}
          <button type="button" aria-label="Retirer l'image" onClick={() => onChange("")}
            style={{ position: "absolute", top: 0, right: 0, width: 44, height: 44, background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--danger)" }}>
            <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(8,8,8,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></span>
          </button>
          <Button onClick={() => setPickerOpen(true)} size="sm"><Upload size={11} /> Changer</Button>
        </div>
      ) : (
        <div
          {...carteCliquable(() => setPickerOpen(true))}
          aria-label="Choisir ou déposer une image"
          className="depot-image"
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{ border: `2px dashed ${dragOver ? G : "color-mix(in srgb, var(--accent) 20%, transparent)"}`, borderRadius: 10, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "transparent", transition: "all 0.2s" }}>
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, border: "2px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderTopColor: G, borderRadius: "50%", animation: "mo-spin 0.8s linear infinite" }} />
              <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>Upload en cours...</p>
            </div>
          ) : (
            <>
              <div style={{ width: 40, height: 40, background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <ImageIcon size={18} color={G} />
              </div>
              {/* Au doigt, on ne « dépose » rien et on ne « clique » pas (20 nov.). */}
              <p style={{ color: "var(--ink)", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}><span className="mot-souris">Cliquez ou déposez une image</span><span className="mot-doigt">Touchez pour choisir une image</span></p>
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{hint || "JPG, PNG, WebP — max 5MB"}</p>
            </>
          )}
        </div>
      )}

      <button type="button" onClick={() => setPickerOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 2, minHeight: 32, background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = G} onMouseLeave={e => e.currentTarget.style.color = MUTED}>
        <FolderOpen size={12} /> Changer d'image…
      </button>

      {/* Choix de la source (#05) : LA feuille d'actions (lot 6 « appli »,
          18 nov.). Faite main, elle ne se tirait pas vers le bas et n'était
          pas annoncée comme fenêtre. Le sélecteur de fichier s'ouvre dans le
          même geste (`onClick` synchrone) : iOS l'exige. */}
      <ActionSheet open={pickerOpen} titre="Ajouter une image" onFermer={() => setPickerOpen(false)} actions={[
        { libelle: "Depuis mon téléphone", detail: "Photo, photothèque ou fichier", icone: <Upload size={19} color={G} />,
          onClick: () => { setPickerOpen(false); inputRef.current?.click() } },
        { libelle: "Ma bibliothèque QRowg", detail: "Images déjà importées", icone: <FolderOpen size={19} color={G} />,
          onClick: () => { setPickerOpen(false); openLibrary() } },
      ]} />

      {error && <p {...propsAnnonce("erreur")} style={{ color: "var(--danger)", fontSize: 11, margin: "6px 0 0" }}>{error}</p>}
      <input ref={inputRef} type="file" aria-label="Choisir une image" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }} />

      {/* Bibliothèque d'images : réutiliser une image déjà uploadée (pas de ré-upload) */}
      {libOpen && (
        <div onClick={() => setLibOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 620, maxHeight: "80vh", background: "#141414", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 9 }}>
              <FolderOpen size={16} color={G} />
              <p style={{ margin: 0, color: "var(--ink)", fontSize: 14, fontWeight: 700, flex: 1 }}>Ma bibliothèque{libAssets && libAssets.length > 0 ? <span style={{ color: MUTED, fontWeight: 400 }}> · {libAssets.length}</span> : ""}</p>
              {libBusy && <div style={{ width: 15, height: 15, border: "2px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderTopColor: G, borderRadius: "50%", animation: "mo-spin 0.8s linear infinite" }} />}
              <button onClick={() => setLibOpen(false)} aria-label="Fermer" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: MUTED, cursor: "pointer", width: 28, height: 28 }}><X size={14} /></button>
            </div>
            {/* Recherche (#07) — visible des qu'il y a des images */}
            {libAssets && libAssets.length > 0 && (
              <div style={{ padding: "0 14px 10px", position: "relative" }}>
                <Search size={14} color={MUTED} style={{ position: "absolute", left: 25, top: "50%", transform: "translateY(-50%)" }} />
                <input value={libQuery} onChange={e => setLibQuery(e.target.value)} placeholder="Rechercher une image…"
                  style={{ width: "100%", height: 42, boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0 12px 0 34px", color: "var(--ink)", fontSize: 14, outline: "none" }} />
              </div>
            )}
            <div style={{ padding: 14, paddingTop: 0, overflowY: "auto" }}>
              {libAssets === null
                ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                    {/* Skeletons realistes immediatement (au lieu d'un texte "Chargement") — #06 */}
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ aspectRatio: "1", borderRadius: 9 }} />
                    ))}
                  </div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                    {/* Tuile d'ajout : upload direct dans la bibliothèque */}
                    {!libQuery && <button onClick={() => libInputRef.current?.click()} title="Ajouter une image"
                      style={{ aspectRatio: "1", border: "2px dashed color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: 9, background: "color-mix(in srgb, var(--accent) 4%, transparent)", color: G, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11.5, fontWeight: 600 }}>
                      <Plus size={18} /> Ajouter
                    </button>}
                    {libAssets.filter(a => correspond(a.name, libQuery))
                      .slice().sort((a, b) => (favs.has(b.url) ? 1 : 0) - (favs.has(a.url) ? 1 : 0))
                      .map(a => (
                      <div key={a.url} style={{ position: "relative", aspectRatio: "1" }}
                        onFocus={e => { const b = e.currentTarget.querySelector(".del") as HTMLElement; if (b) b.style.opacity = "1" }}
                        onBlur={e => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; const b = e.currentTarget.querySelector(".del") as HTMLElement; if (b) b.style.opacity = "0" }}
                        onMouseEnter={e => { const b = e.currentTarget.querySelector(".del") as HTMLElement; if (b) b.style.opacity = "1" }}
                        onMouseLeave={e => { const b = e.currentTarget.querySelector(".del") as HTMLElement; if (b) b.style.opacity = "0" }}>
                        <Button onClick={() => { onChange(a.url); setLibOpen(false) }} title={a.name} variant="ghost" fullWidth><Vignette src={a.url} alt="" sizes="110px" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></Button>
                        <button onClick={e => { e.stopPropagation(); toggleFav(a.url) }} aria-label={favs.has(a.url) ? "Retirer des favoris" : "Ajouter aux favoris"} title={favs.has(a.url) ? "Retirer des favoris" : "Favori"}
                          style={{ position: "absolute", top: 4, left: 4, background: "rgba(8,8,8,0.82)", border: "none", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: favs.has(a.url) ? "#FFD700" : "rgba(255,255,255,0.6)" }}>
                          <Star size={12} fill={favs.has(a.url) ? "#FFD700" : "none"} />
                        </button>
                        <button className="del" onClick={e => { e.stopPropagation(); removeAsset(a) }} aria-label="Supprimer"
                          style={{ position: "absolute", top: 4, right: 4, opacity: 0, transition: "opacity .15s", background: "rgba(8,8,8,0.82)", border: "none", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--danger)" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {libAssets.length === 0 && (
                      <p style={{ gridColumn: "1 / -1", color: MUTED, fontSize: 12, textAlign: "center", padding: "18px 0 4px", margin: 0 }}>Aucune image encore — utilisez « Ajouter » ci-dessus.</p>
                    )}
                    {libAssets.length > 0 && libQuery && libAssets.filter(a => correspond(a.name, libQuery)).length === 0 && (
                      <p style={{ gridColumn: "1 / -1", color: MUTED, fontSize: 12, textAlign: "center", padding: "18px 0 4px", margin: 0 }}>Aucun résultat pour « {libQuery} ».</p>
                    )}
                  </div>}
            </div>
            <input ref={libInputRef} type="file" aria-label="Ajouter une image à la bibliothèque" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLibFile(f); e.target.value = "" }} />
          </div>
        </div>
      )}
      {cropFile && <ImageCropModal file={cropFile} initialAspect={cropAspect} onCancel={() => setCropFile(null)} onConfirm={onCropConfirm} />}
      <style>{``}</style>
    </div>
  )
}
