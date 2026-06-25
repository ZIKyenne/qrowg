"use client";

import { useMemo, useState, useTransition } from "react";
import styles from "./AvatarStudio.module.css";
import {
  buildExportSvg,
  currentGrid,
  FAMILIES,
  PRESETS,
  type AvatarConfig,
  type AvatarShape,
  type Family,
  type ModuleShape,
} from "./templates";
import { saveAvatar } from "./actions";

/* SVG de modules rendu en React (pas de dangerouslySetInnerHTML) */
function QrSvg({
  grid,
  gap,
  shape,
  fg,
}: {
  grid: number[][];
  gap: number;
  shape: ModuleShape;
  fg: string;
}) {
  const G = grid.length;
  const rx = shape === "dot" ? (1 - gap) / 2 : shape === "rounded" ? 0.2 : 0;
  return (
    <svg
      viewBox={`-1 -1 ${G + 2} ${G + 2}`}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering={shape === "square" ? "crispEdges" : "geometricPrecision"}
      width="100%"
      height="100%"
      aria-hidden
    >
      {grid.flatMap((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${y}_${x}`}
              x={x + gap / 2}
              y={y + gap / 2}
              width={1 - gap}
              height={1 - gap}
              rx={rx}
              fill={fg}
            />
          ) : null
        )
      )}
    </svg>
  );
}

function download(filename: string, url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* HSL -> hex (#rrggbb) pour les couleurs aléatoires (compatible <input type=color>) */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/* Tirage 100% aléatoire de TOUS les paramètres (famille, modèle, formes, espacement, cadre, couleurs) */
function randomAvatar(): AvatarConfig {
  const family = pick(Object.keys(FAMILIES) as Family[]);
  // Couleurs : soit un preset soigné, soit une paire générée à fort contraste
  let fg: string, bg: string;
  if (Math.random() < 0.45) {
    const p = pick(PRESETS);
    fg = p.fg;
    bg = p.bg;
  } else {
    const hue = Math.floor(rand(0, 360));
    fg = hslToHex(hue, rand(62, 92), rand(54, 72));
    bg = Math.random() < 0.72
      ? hslToHex((hue + Math.floor(rand(-20, 20)) + 360) % 360, rand(18, 42), rand(5, 11))   // fond sombre teinté
      : hslToHex((hue + 180) % 360, rand(8, 18), rand(92, 97));                               // fond clair complémentaire
  }
  return {
    family,
    index: Math.floor(Math.random() * FAMILIES[family].count),
    avatarShape: pick(["rounded", "circle"] as const),
    moduleShape: pick(["square", "rounded", "dot"] as const),
    gap: Math.round(rand(0, 0.32) / 0.02) * 0.02,
    showFrame: family !== "patterns" && Math.random() < 0.6,
    fg,
    bg,
  };
}

export default function AvatarStudio({
  initialConfig,
  signedIn,
}: {
  initialConfig: AvatarConfig;
  signedIn: boolean;
}) {
  const [cfg, setCfg] = useState<AvatarConfig>(initialConfig);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const set = (patch: Partial<AvatarConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const previewGrid = useMemo(
    () => currentGrid(cfg.family, cfg.index, cfg.showFrame),
    [cfg.family, cfg.index, cfg.showFrame]
  );

  const onSave = () => {
    setStatus(null);
    startTransition(async () => {
      const res = await saveAvatar(buildExportSvg(cfg), cfg);
      setStatus(res.ok ? "Avatar enregistré dans votre profil." : res.error);
    });
  };

  const onPng = () => {
    const svg = buildExportSvg(cfg);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 1024;
      c.getContext("2d")!.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);
      download("qrfolio-avatar.png", c.toDataURL("image/png"));
    };
    img.src = url;
  };

  const onSvg = () => {
    const blob = new Blob([buildExportSvg(cfg)], { type: "image/svg+xml" });
    download("qrfolio-avatar.svg", URL.createObjectURL(blob));
  };

  return (
    <div className={styles.wrap}>
      <header>
        <div className={styles.eyebrow}>QRfolio · Studio d&apos;avatar</div>
        <h1 className={styles.title}>
          Composez votre <em>photo de profil</em>.
        </h1>
        <p className={styles.lede}>
          Choisissez un modèle, ajustez les modules et les couleurs, puis
          enregistrez votre avatar en QR-art sur votre profil.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Aperçu */}
        <div className={`${styles.panel} ${styles.stage}`}>
          <div
            className={`${styles.preview} ${cfg.avatarShape === "circle" ? styles.circle : styles.rounded}`}
            style={{ background: cfg.bg }}
          >
            <span className={styles.ring} />
            <QrSvg grid={previewGrid} gap={cfg.gap} shape={cfg.moduleShape} fg={cfg.fg} />
          </div>

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.primary}`} onClick={onSave} disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer sur mon profil"}
            </button>
          </div>
          <div className={styles.actions}>
            <button className={styles.btn} onClick={onPng}>Télécharger PNG</button>
            <button className={styles.btn} onClick={onSvg}>SVG</button>
            <button
              className={`${styles.btn} ${styles.ghost}`}
              aria-label="Tout aléatoire (formes, couleurs, modèle)"
              title="Surprends-moi — tout aléatoire"
              onClick={() => setCfg(randomAvatar())}
            >
              ⤮
            </button>
          </div>
          {status && (
            <p className={styles.status}>
              {signedIn ? status : "Connectez-vous pour enregistrer. Le téléchargement reste disponible."}
            </p>
          )}
        </div>

        {/* Réglages */}
        <div className={styles.panel}>
          <div className={styles.block}>
            <span className={styles.label}>Famille</span>
            <div className={styles.tabs} role="tablist">
              {(Object.keys(FAMILIES) as Family[]).map((key) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={cfg.family === key}
                  className={styles.tab}
                  onClick={() => set({ family: key, index: 0 })}
                >
                  {FAMILIES[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.block}>
            <span className={styles.label}>Modèle</span>
            <div className={styles.gallery}>
              {Array.from({ length: FAMILIES[cfg.family].count }).map((_, i) => (
                <div
                  key={i}
                  className={styles.swatch}
                  aria-selected={cfg.index === i}
                  onClick={() => set({ index: i })}
                >
                  <QrSvg
                    grid={currentGrid(cfg.family, i, cfg.showFrame)}
                    gap={cfg.gap}
                    shape={cfg.moduleShape}
                    fg="currentColor"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.block}>
            <span className={styles.label}>Forme de l&apos;avatar</span>
            <Seg<AvatarShape>
              value={cfg.avatarShape}
              options={[
                { v: "rounded", label: "Carré arrondi" },
                { v: "circle", label: "Cercle" },
              ]}
              onChange={(v) => set({ avatarShape: v })}
            />
          </div>

          <div className={styles.block}>
            <span className={styles.label}>Forme des modules</span>
            <Seg<ModuleShape>
              value={cfg.moduleShape}
              options={[
                { v: "square", label: "Carré" },
                { v: "rounded", label: "Arrondi" },
                { v: "dot", label: "Point" },
              ]}
              onChange={(v) => set({ moduleShape: v })}
            />
          </div>

          <div className={styles.block}>
            <span className={styles.label}>Espacement des modules</span>
            <div className={styles.row}>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.02}
                value={cfg.gap}
                onChange={(e) => set({ gap: parseFloat(e.target.value) })}
                className={styles.range}
              />
              <span className={styles.val}>{cfg.gap.toFixed(2)}</span>
            </div>
          </div>

          {cfg.family !== "patterns" && (
            <div className={styles.block}>
              <div className={styles.row}>
                <span className={styles.label} style={{ margin: 0 }}>Cadre QR</span>
                <button
                  role="switch"
                  aria-checked={cfg.showFrame}
                  className={styles.switch}
                  onClick={() => set({ showFrame: !cfg.showFrame })}
                />
              </div>
            </div>
          )}

          <div className={styles.block}>
            <span className={styles.label}>Couleurs</span>
            <div className={styles.presets}>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className={styles.preset}
                  title={p.name}
                  aria-selected={cfg.fg === p.fg && cfg.bg === p.bg}
                  onClick={() => set({ fg: p.fg, bg: p.bg })}
                >
                  <i style={{ background: p.bg }} />
                  <i className={styles.presetFg} style={{ background: p.fg }} />
                </button>
              ))}
            </div>
            <div className={styles.colors}>
              <label className={styles.colorField}>
                <span>Modules</span>
                <div className={styles.colorInput}>
                  <input type="color" value={cfg.fg} onChange={(e) => set({ fg: e.target.value })} />
                  <code>{cfg.fg.toUpperCase()}</code>
                </div>
              </label>
              <label className={styles.colorField}>
                <span>Fond</span>
                <div className={styles.colorInput}>
                  <input type="color" value={cfg.bg} onChange={(e) => set({ bg: e.target.value })} />
                  <code>{cfg.bg.toUpperCase()}</code>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.seg}>
      {options.map((o) => (
        <button
          key={o.v}
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
