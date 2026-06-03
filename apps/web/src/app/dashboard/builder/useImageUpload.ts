import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)

  async function uploadImage(file: File, path: string): Promise<string | null> {
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const ext = file.name.split(".").pop()
      const fileName = `${user.id}/${path}-${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from("page-assets")
        .upload(fileName, file, { upsert: true, contentType: file.type })

      if (error) { console.error("Upload error:", error); return null }

      const { data: { publicUrl } } = supabase.storage
        .from("page-assets")
        .getPublicUrl(fileName)

      return publicUrl
    } finally {
      setUploading(false)
    }
  }

  return { uploadImage, uploading }
}
