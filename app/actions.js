"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function addProductAction(formData) {
  try {
    console.log("[v0] Server Action: Starting product creation")

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not configured")
    }

    // Extract form data
    const name = formData.get("name")
    const price = formData.get("price")
    const description = formData.get("description")
    const categoryId = formData.get("categoryId")
    const imageFile = formData.get("image")

    console.log("[v0] Server Action: Form data extracted", { name, price, categoryId, hasImage: !!imageFile })

    let imageUrl = "https://placehold.co/300x300/EAD5B7/333?text=Produto"

    // Handle image upload if file exists
    if (imageFile && imageFile.size > 0) {
      try {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `product-image-${Date.now()}.${fileExt}`

        console.log("[v0] Server Action: Uploading image", fileName)

        // Convert File to ArrayBuffer for server-side upload
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("product-images")
          .upload(fileName, buffer, {
            contentType: imageFile.type,
            upsert: false,
          })

        if (uploadError) {
          console.error("[v0] Server Action: Image upload failed", uploadError)
          if (uploadError.message.includes("Bucket not found")) {
            console.log("[v0] Server Action: Using placeholder image due to missing bucket")
          } else {
            throw uploadError
          }
        } else {
          // Get public URL
          const {
            data: { publicUrl },
          } = supabaseAdmin.storage.from("product-images").getPublicUrl(fileName)

          imageUrl = publicUrl
          console.log("[v0] Server Action: Image uploaded successfully", imageUrl)
        }
      } catch (uploadErr) {
        console.error("[v0] Server Action: Image upload exception", uploadErr)
        // Continue with placeholder image
      }
    }

    // Insert product into database
    const productData = {
      name: name,
      price: price ? Number.parseFloat(price) : null,
      description: description || "",
      category_id: categoryId,
      image_url: imageUrl,
      is_available: true,
    }

    console.log("[v0] Server Action: Inserting product", productData)

    const { data: product, error: insertError } = await supabaseAdmin
      .from("products")
      .insert([productData])
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Server Action: Product insert failed", insertError)
      throw insertError
    }

    console.log("[v0] Server Action: Product created successfully", product)
    return { success: true, data: product }
  } catch (error) {
    console.error("[v0] Server Action: Error in addProductAction", error)
    return { success: false, error: error.message }
  }
}

export async function uploadImageToStorage(imageFile, fileName) {
  try {
    console.log("[v0] Server action: Uploading image to storage", fileName)

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Server action: Upload error", uploadError)
      throw new Error(`Upload error: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("product-images").getPublicUrl(fileName)

    console.log("[v0] Server action: Image uploaded successfully", publicUrl)
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("[v0] Server action: Upload failed", error)
    return { success: false, error: error.message }
  }
}
