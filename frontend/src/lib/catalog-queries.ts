import { SupabaseClient } from "@supabase/supabase-js";

export type ProductStatus = "draft" | "published" | "archived";
export type ProductAvailability = "available" | "sold_out" | "coming_soon";

export interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  category_name: string | null;
  availability: ProductAvailability;
  primary_image_url: string | null;
  is_new: boolean;
  total_stock: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SearchCatalogParams {
  query?: string;
  category?: string;
  availability?: ProductAvailability;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export async function getStorefrontProducts(
  supabase: SupabaseClient,
  params: SearchCatalogParams
): Promise<{ data: CatalogProduct[] | null; error: Error | null; total?: number }> {
  try {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 12;
    const offset = (page - 1) * limit;

    const categorySelection = params.category ? 'categories!inner(name,slug)' : 'categories(name,slug)';
    let query = supabase
      .from('products')
      .select(`*,${categorySelection},product_variants(*),product_images(*)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (params.category) query = query.eq('categories.slug', params.category);
    if (params.query) query = query.ilike('name', `%${params.query}%`);
    if (params.availability) query = query.eq('status', params.availability);
    
    const { data, error, count } = await query;

    if (error) {
      console.error("[catalog-queries] fetch error:", error);
      return { data: null, error };
    }
    
    // Sort logic inside JS for prices if requested, though it only sorts within the page.
    let products = data || [];

    const mapped: CatalogProduct[] = products.map((p: any) => {
       const variants = p.product_variants || [];
       const images = p.product_images || [];
       const primaryImg = images.find((i:any) => i.is_primary) || images[0];
       const primaryVariant = variants.find((v:any) => v.is_active) || variants[0];
       
       let imageUrl = primaryImg ? primaryImg.object_path : null;
       if (imageUrl && !imageUrl.startsWith('http')) {
         const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
         const encodedPath = imageUrl.split('/').map(encodeURIComponent).join('/');
         imageUrl = `${baseUrl}/storage/v1/object/public/product-images/${encodedPath}`;
       }
       
       return {
         id: String(p.id),
         title: p.name,
         slug: p.slug,
         base_price: primaryVariant ? Number(primaryVariant.price) : 0,
         category_name: p.categories?.name || null,
         availability: p.status as ProductAvailability,
         primary_image_url: imageUrl,
         is_new: p.is_featured || false,
         total_stock: variants.reduce((sum:number, v:any) => sum + Number(v.stock_quantity || 0), 0)
       };
    });
    
    if (params.sort === 'price_asc') {
      mapped.sort((a, b) => a.base_price - b.base_price);
    } else if (params.sort === 'price_desc') {
      mapped.sort((a, b) => b.base_price - a.base_price);
    }

    return { data: mapped, error: null, total: count || 0 };
  } catch (error) {
    console.error("[catalog-queries] Unexpected error:", error);
    return { data: null, error: error as Error };
  }
}

export async function getStorefrontCategories(
  supabase: SupabaseClient
): Promise<{ data: CatalogCategory[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[catalog-queries] fetch categories error:", error);
      return { data: null, error };
    }

    return { data: data.map(d => ({...d, id: String(d.id)})) as CatalogCategory[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
