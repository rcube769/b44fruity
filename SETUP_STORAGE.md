# Supabase Storage Setup for Fruit Images

## Steps to Create the Storage Bucket:

1. **Go to your Supabase Dashboard** at https://supabase.com

2. **Navigate to**: Storage (in the left sidebar)

3. **Click**: "New bucket"

4. **Fill in the details**:
   - **Name**: `fruit-images`
   - **Public bucket**: ✅ **Check this box** (images need to be publicly accessible)
   - **File size limit**: 5 MB (optional, but recommended)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/jpg` (optional)

5. **Click**: "Create bucket"

6. **Set up RLS (Row Level Security) policies** (optional but recommended):
   - Go to the Storage policies for the `fruit-images` bucket
   - Add an INSERT policy:
     ```sql
     CREATE POLICY "Users can upload their own fruit images"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (
       bucket_id = 'fruit-images' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );
     ```
   - Add a SELECT policy (make images publicly readable):
     ```sql
     CREATE POLICY "Fruit images are publicly accessible"
     ON storage.objects FOR SELECT
     TO public
     USING (bucket_id = 'fruit-images');
     ```

## Alternative: Using Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
# Create the bucket
supabase storage buckets create fruit-images --public

# Set policies (optional)
supabase storage policies create \
  --bucket-id fruit-images \
  --policy-name "Users can upload images" \
  --definition "bucket_id = 'fruit-images'" \
  --operation INSERT \
  --to authenticated
```

## Testing

After setup, try creating a new listing with a fruit image. The image should:
1. Upload successfully to the `fruit-images` bucket
2. Display in your Dashboard under "My Listings"
3. Be accessible via the public URL

## Troubleshooting

If images don't upload:
- Verify the bucket name is exactly `fruit-images`
- Ensure the bucket is marked as **Public**
- Check that authenticated users have INSERT permissions
- Look for errors in the browser console
