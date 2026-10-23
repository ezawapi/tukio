import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.p14a5b57bda784c93bd8ef99983d5b60a',
  appName: 'tukio',
  webDir: 'dist',
  // The sandbox URL is for device testing only, never for store distribution.
  ...(process.env.TUKIO_NATIVE_PREVIEW === 'true' ? {
    server: {
      url: 'https://14a5b57b-da78-4c93-bd8e-f99983d5b60a.lovableproject.com?forceHideBadge=true',
      cleartext: true,
    },
  } : {}),
};

export default config;
