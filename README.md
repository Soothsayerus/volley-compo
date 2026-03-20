# Volley — Compo (déploiement rapide)

## Lancer en local
```bash
npm install
npm run dev
```

## Build production
```bash
npm run build
npm run preview
```

## Déploiement Vercel
1. Pousse ce dossier dans ton dépôt GitHub `volley-compo`.
2. Sur https://vercel.com → New Project → Import `volley-compo`.
3. Framework preset: **Vite** (auto-détecté). Build command: `vite build`. Output: `dist/` (auto).
4. Deploy → tu obtiens ton URL publique. Ajoute-la à l'écran d'accueil sur iPhone (Partager → Ajouter à l’écran d’accueil).
