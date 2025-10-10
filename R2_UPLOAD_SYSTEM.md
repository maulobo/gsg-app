# Cloudflare R2 Upload System Documentation

## Overview

This implementation provides a complete image upload system using Cloudflare R2 storage for product images. The system includes:

- Image processing and optimization using Sharp
- Drag-and-drop file upload interface
- Multiple image types support (cover, gallery, tech)
- File validation and size limits
- Progress tracking and notifications
- Database synchronization with Supabase

## Features

### Image Processing
- Automatic conversion to WebP format for optimal compression
- Different sizing strategies per image type:
  - **Cover**: 800x600px (product main image)
  - **Gallery**: 1200x900px (gallery images)
  - **Tech**: 1600x1200px (technical sheets)

### File Validation
- 5MB maximum file size
- Supported formats: JPEG, PNG, WebP, AVIF
- Client-side and server-side validation

### Upload Interface
- Drag-and-drop functionality
- Progress tracking with visual indicators
- Multiple file upload with limits per type
- Delete functionality for uploaded images

## Required Environment Variables

Add these variables to your `.env.local` file:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_R2_BUCKET_NAME=your_r2_bucket_name
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
```

## Cloudflare R2 Setup

1. **Create R2 Bucket**:
   - Go to Cloudflare Dashboard → R2 Object Storage
   - Create a new bucket
   - Note the bucket name

2. **Create API Token**:
   - Go to Cloudflare Dashboard → R2 → Manage R2 API tokens
   - Create a new token with R2 read/write permissions
   - Copy the Access Key ID and Secret Access Key

3. **Get R2 Endpoint**:
   - Your endpoint will be: `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`
   - Replace `YOUR_ACCOUNT_ID` with your actual Cloudflare account ID

## File Structure

### Components
- `src/components/products/ProductImageUpload.tsx` - Main upload component
- `src/components/products/ProductCreationForm.tsx` - Integrated form with upload

### API Routes
- `src/app/api/products/images/upload/route.ts` - Upload/delete endpoints

### Libraries
- `src/lib/r2client.ts` - R2 client and image processing functions

## Usage in Product Creation

The image upload is integrated into the product creation form with three sections:

1. **Cover Image** (1 image max) - Main product image
2. **Gallery Images** (5 images max) - Additional product photos
3. **Technical Sheets** (3 images max) - Technical documentation

Images are uploaded during product creation and linked to the product in the database.

## Database Schema

The system uses the existing `media_assets` table with:

```sql
- id: Primary key
- product_id: Reference to products table
- variant_id: Optional reference to variants
- path: R2 URL of the image
- kind: Type of image ('cover', 'gallery', 'tech')
- alt_text: Alternative text for accessibility
- created_at: Upload timestamp
```

## Testing

After setup, you can test the upload system by:

1. Navigate to the product creation form
2. Fill in basic product information
3. Upload images in each section
4. Review the uploaded images in the review step
5. Complete product creation

The images will be processed, uploaded to R2, and saved to the database with proper references.

## Error Handling

The system includes comprehensive error handling for:

- File validation errors
- Upload failures
- Database synchronization issues
- R2 connection problems

All errors are displayed to users via toast notifications.