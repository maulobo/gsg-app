/**
 * @deprecated This file is deprecated. Use the feature-based structure instead:
 * - Queries: @/features/products/queries
 * - Actions: @/features/products/actions
 * - Types: @/features/products/types
 * 
 * This file exists only for backwards compatibility.
 */

// Re-export from new structure
export { getProductByCode as getProduct } from '@/features/products/queries'
export type { ProductWithRelations as Product } from '@/features/products/types'
