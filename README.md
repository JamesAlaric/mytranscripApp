# Meeting Transcriber

Une application web moderne pour la transcription et le résumé automatique de réunions.

## Fonctionnalités

- ✅ Upload de fichiers audio (MP3, WAV, M4A) jusqu'à 2GB
- ✅ Transcription automatique avec Whisper.js (haute précision)
- ✅ Résumé intelligent avec structure organisée
- ✅ Interface utilisateur moderne et intuitive
- ✅ Téléchargement des résultats (TXT, PDF)
- ✅ Traitement entièrement gratuit (pas d'API payante)
- ✅ Thème clair/sombre

## Structure du résumé

```
📋 RÉSUMÉ EXÉCUTIF
[2-3 phrases de synthèse]

🎯 POINTS CLÉS DISCUTÉS
• Point 1
• Point 2

✅ DÉCISIONS PRISES  
1. Décision 1
2. Décision 2

📝 ACTIONS À SUIVRE
- [Qui] : [Action] - [Échéance]

👥 PARTICIPANTS IDENTIFIÉS
[Liste si détectable]

⏭️ PROCHAINES ÉTAPES
[Points de suivi]
```

## Technologies utilisées

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Transcription**: Whisper.js via @xenova/transformers
- **Résumé**: Algorithme d'extraction et structuration de texte (local)
- **Export**: TXT, PDF (via impression navigateur)

## Installation

1. Clonez ce dépôt:
```bash
git clone https://github.com/votre-nom/meeting-transcriber.git
cd meeting-transcriber
```

2. Installez les dépendances:
```bash
pnpm install
```

3. Lancez le serveur de développement:
```bash
pnpm dev
```

4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Déploiement

### Déploiement sur Vercel

1. Créez un compte sur [Vercel](https://vercel.com) si vous n'en avez pas déjà un.
2. Installez l'outil CLI Vercel:
```bash
pnpm install -g vercel
```
3. Déployez l'application:
```bash
vercel
```

### Déploiement sur Netlify

1. Créez un compte sur [Netlify](https://netlify.com) si vous n'en avez pas déjà un.
2. Construisez l'application:
```bash
pnpm build
```
3. Déployez le dossier `out`:
```bash
netlify deploy --prod
```

## Fonctionnement technique

1. **Upload de fichier**: L'application accepte les fichiers audio MP3, WAV et M4A jusqu'à 2GB.
2. **Transcription**: Utilise Whisper.js via @xenova/transformers pour transcrire l'audio directement dans le navigateur.
3. **Résumé**: Analyse la transcription pour extraire les points clés, décisions, et actions à suivre.
4. **Export**: Permet d'exporter la transcription et le résumé en formats TXT et PDF.

## Limitations

- Le traitement dans le navigateur peut être lent pour les fichiers audio très longs.
- La qualité de la transcription dépend de la clarté de l'audio d'origine.
- Le résumé automatique est basé sur des règles et peut ne pas capturer tous les détails importants.

## Licence

MIT
