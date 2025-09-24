"use server"

import { createClient } from "@supabase/supabase-js"

export async function addProductAction(formData) {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log("[v0] Server Action started")

    const name = formData.get("name")
    const price = formData.get("price")
    const description = formData.get("description")
    const categoryId = formData.get("categoryId")
    const imageFile = formData.get("image")

    console.log("[v0] Form data extracted:", { name, price, description, categoryId, imageFileName: imageFile?.name })

    if (!name || !categoryId || !imageFile || imageFile.size === 0) {
      throw new Error("Nome, categoria e imagem são obrigatórios.")
    }

    const fileName = `${Date.now()}-${imageFile.name}`
    console.log("[v0] Uploading image:", fileName)

    let uploadResult
    try {
      uploadResult = await supabaseAdmin.storage.from("product-images").upload(fileName, imageFile)
    } catch (uploadError) {
      console.log("[v0] Upload network error:", uploadError)
      // Handle network or parsing errors
      throw new Error(`Erro no upload da imagem: ${uploadError.message || "Erro de conexão"}`)
    }

    const { data: uploadData, error: uploadError } = uploadResult

    if (uploadError) {
      console.log("[v0] Upload error:", uploadError)
      // Handle Supabase-specific errors
      if (uploadError.message?.includes("Too Many")) {
        throw new Error("Muitas requisições. Tente novamente em alguns segundos.")
      }
      throw new Error(`Erro no upload: ${uploadError.message || "Erro desconhecido"}`)
    }

    console.log("[v0] Image uploaded successfully:", uploadData.path)

    const { data: publicUrlData } = supabaseAdmin.storage.from("product-images").getPublicUrl(uploadData.path)

    const imageUrl = publicUrlData.publicUrl
    console.log("[v0] Public URL generated:", imageUrl)

    const productData = {
      name,
      description,
      price: price ? Number.parseFloat(price) : null,
      category_id: categoryId,
      image_url: imageUrl,
    }

    console.log("[v0] Inserting product:", productData)

    const { error: insertError } = await supabaseAdmin.from("products").insert([productData])

    if (insertError) {
      console.log("[v0] Insert error:", insertError)
      throw insertError
    }

    console.log("[v0] Product inserted successfully!")
    return { success: true }
  } catch (error) {
    console.error("Erro na Server Action:", error.message)
    return { success: false, error: error.message }
  }
}
