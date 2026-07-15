# Riverra Family Archive

React/Vite single-page application for the Riverra family archive. The public site contains the family landing page and interactive D3 family tree; the admin area connects to the Riverra API for authenticated member management.

## Development

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run lint
npm run build
```

## Configuration

Create `.env.local` for local development when using a different API or Cloudinary account:

```env
VITE_API_URL=https://riverra-backend.vercel.app/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Only public, non-secret configuration belongs in `VITE_*` variables. Upload presets must be restricted in Cloudinary; privileged credentials must never be placed in frontend environment variables.

## Deployment

Netlify runs `npm run build` and publishes `dist`. The SPA fallback is configured in `netlify.toml`. The backend must enforce authentication and role authorization independently of the controls rendered by this frontend.

## Data and privacy

Family data is loaded from the API. Browser storage is used only as a short-lived UI cache and must not be treated as the source of truth. Avoid placing bearer tokens in URLs; production OAuth should exchange a one-time code for a Secure, HttpOnly session cookie.
