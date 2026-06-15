# Suzzy’s ASMR

Static booking site with a small Vercel-backed admin.

## Vercel setup

1. Connect the GitHub repo to Vercel.
2. In Vercel, create/connect a Blob store for the project.
3. Add these environment variables:
   - `BLOB_READ_WRITE_TOKEN`: created by Vercel Blob.
   - `ADMIN_PIN`: the private PIN Suzzy will use on `/admin.html`. If this is not set, the code falls back to `123456`.
4. Redeploy the project after adding the environment variables.

Bookings are submitted through `/api/bookings`, receipts are stored in Vercel Blob, and Suzzy can review requests at `/admin.html`.
