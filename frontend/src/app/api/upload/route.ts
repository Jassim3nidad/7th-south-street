import { randomUUID } from 'crypto'
import { failure, handleRouteError, success } from '@/lib/http'
import { requireAdmin } from '@/lib/supabase/admin'
import {
  allowedImageTypes,
  hasValidImageSignature,
  isValidProductImagePath,
} from '@/lib/upload-validation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let uploadedPath: string | null = null
  try {
    const { supabase } = await requireAdmin()
    const form = await request.formData()
    const file = form.get('image')
    const productId = Number(form.get('product_id'))
    if (!(file instanceof File)) return failure('An image file is required')
    if (!Number.isInteger(productId) || productId < 1) return failure('A valid product is required')
    if (file.size < 1 || file.size > 5 * 1024 * 1024) return failure('Image must be no larger than 5MB')

    const extension = allowedImageTypes.get(file.type)
    if (!extension) return failure('Only JPEG, PNG, and WebP images are allowed')
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!hasValidImageSignature(file.type, bytes)) return failure('Image signature does not match its MIME type')

    uploadedPath = `products/${productId}/${randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(uploadedPath, bytes, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError

    const altText = form.get('alt_text')
    const { data: image, error: recordError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        object_path: uploadedPath,
        alt_text: typeof altText === 'string' ? altText : null,
        sort_order: Number(form.get('sort_order') ?? 0),
        is_primary: form.get('is_primary') === 'true',
      })
      .select('id,object_path')
      .single()

    if (recordError) {
      await supabase.storage.from('product-images').remove([uploadedPath])
      uploadedPath = null
      throw recordError
    }

    const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(image.object_path)
    return success({ ...image, url: publicUrl.publicUrl }, 'Uploaded', 201)
  } catch (error) {
    return handleRouteError(error, 'Unable to upload image')
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase } = await requireAdmin()
    const body = await request.json()
    const path = typeof body?.object_path === 'string' ? body.object_path : ''
    if (!isValidProductImagePath(path)) {
      return failure('A valid product image path is required')
    }
    const { error: storageError } = await supabase.storage.from('product-images').remove([path])
    if (storageError) throw storageError
    const { error: recordError } = await supabase.from('product_images').delete().eq('object_path', path)
    if (recordError) throw recordError
    return success(null, 'Image deleted')
  } catch (error) {
    return handleRouteError(error, 'Unable to delete image')
  }
}
