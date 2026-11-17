"use client"

// Aiguillage QR Studio : le Studio compact par défaut (rendu dès le serveur, sans
// flash) ; l'ancien seulement sur `?zero=0`, le temps de la vérification.
import { useEffect, useState } from "react"
import QRStudio from "./QRStudio"
import type { QRCode } from "./styleQr"
import QRStudioZero from "./QRStudioZero"
import { ancienStudioDemande } from "./qrStudioFlags"

type Props = { qrCodes: QRCode[]; userPlan: string; appUrl: string }

export default function QRStudioSwitch(props: Props) {
  const [ancien, setAncien] = useState(false)
  useEffect(() => { if (ancienStudioDemande()) setAncien(true) }, [])
  return ancien ? <QRStudio {...props} /> : <QRStudioZero {...props} />
}
