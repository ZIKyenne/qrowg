"use client"
// image_carousel — Des photos qui défilent. L'aperçu de l'éditeur dessinait
// une bande de vignettes et des points immobiles ; il montre maintenant le
// carrousel de la page, flèches et défilement compris.
import { photosCarrousel } from "../../models/medias"
import { Carrousel } from "../../primitives/Carrousel"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof photosCarrousel>> }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={m.titre} />
      {/* Un carrousel qui défile tout seul pendant qu'on compose la page serait
          insupportable : l'aperçu reste sur la photo choisie (choix assumé,
          `apercuFidele`). Flèches et points, eux, marchent des deux côtés. */}
      <Carrousel photos={m.photos} titre={m.titre} defilement={u.mode === "public" && m.defilement} hauteur={sz(u, 240)} />
    </div>
  )
}

export function EditorImageCarousel({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = photosCarrousel(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎠" label="Ajoutez au moins une photo" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicImageCarousel({ content, ctx }: PublicAdapterProps) {
  const m = photosCarrousel(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
