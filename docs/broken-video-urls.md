# Broken video / poster URLs (add correct files later)

These paths are referenced in the site HTML but return **HTTP 404** on the live CMS and therefore also fail locally.  
**Do not remove the tags yet** — replace with working URLs (or re-upload files to these exact paths) when assets are ready.

Fill in the **Correct URL** column when you have the real media.

| # | Current (broken) path | Used on (examples) | Correct URL (TODO) |
|---|----------------------|--------------------|--------------------|
| 1 | `/storage/app/media/Video/videos-2025/MLI_Website_Intro.webp` | Home, Coaching, Leitbild | |
| 2 | `/storage/app/media/Video/videos-2025/MAS_MLI_Website_Intro_16-9_4K_1.webm` | Home, Coaching, Leitbild | |
| 3 | `/storage/app/media/Video/videos-2025/MLI_Website_Stark_in_Fuehrung.webp` | Stark in Führung | |
| 4 | `/storage/app/media/Video/videos-2025/masmliwebsitestarkinfuhrung16-9hd1.webm` | Stark in Führung | |
| 5 | `/storage/app/media/Video/videos-2025/MLI_Website_Strategieaktivierung.webp` | Strategieaktivierung | |
| 6 | `/storage/app/media/Video/videos-2025/MAS_MLI_Website_Strategieaktivierung_16-9_4K_1.webm` | Strategieaktivierung | |
| 7 | `/storage/app/media/Video/videos-2025/en/1.png` | `/en/` | |
| 8 | `/storage/app/media/Video/videos-2025/en/MAS_MLI_Website_Intro_16-9_4K_english_sub2_1_1.webm` | `/en/` | |
| 9 | `/storage/app/media/Video/videos-2025/en/2.png` | EN strategy pages | |
| 10 | `/storage/app/media/Video/videos-2025/en/MAS_MLI_Website_Strategieaktivierung_16-9_4K_english_sub_1_1.webm` | EN strategy pages | |
| 11 | `/storage/app/media/Video/videos-2025/en/3.png` | `/en/strong-in-leadership/` | |
| 12 | `/storage/app/media/Video/videos-2025/en/masmliwebsitestarkinfuhrung16-94kenglishsub11.webm` | `/en/strong-in-leadership/` | |
| 13 | `/storage/app/media/Video/poster-warum-strategieaktivierung-poster.jpg` | Strategieaktivierung | |
| 14 | `/storage/app/media/Video/Warum%20Strategie%20Aktivierung.mp4` | Strategieaktivierung | |
| 15 | `/storage/app/media/Video/Poster-Frames/STRATEGYme-Thumbnail.jpg` | Ressourcen | |
| 16 | `/storage/app/media/Video/STRATEGYme.mp4` | Ressourcen | |
| 17 | `/storage/app/media/Video/interview-with-joe-kaeser-ceo-of-siemens-about-meaning-at-work.mp4` | Leadership Stories | |
| 18 | `/storage/app/media/Video/Strategieentwicklung/MLI_Strategische_Mission.mp4` | Strategieentwicklung | |
| 19 | `/storage/app/media/Video/Strategieentwicklung/MLI_Chancen_und_Risiken.mp4` | Strategieentwicklung | |
| 20 | `/storage/app/media/Video/Strategieentwicklung/MLI_Zielgruppe.mp4` | Strategieentwicklung | |
| 21 | `/storage/app/media/Video/Strategieentwicklung/MLI_BHAG.mp4` | Strategieentwicklung | |
| 22 | `/storage/app/media/Video/Strategieentwicklung/MLI_Wertschoepfung.mp4` | Strategieentwicklung | |
| 23 | `/storage/app/media/Video/Strategieentwicklung/MLI_Five4_Success.mp4` | Strategieentwicklung | |
| 24 | `/storage/app/media/Video/Strategieentwicklung/MLI_OKR._Sebastian%20Morgner.mp4` | Strategieentwicklung | |

## How to fix later

1. Put files in `public/storage/...` (same relative path), **or**
2. Search-replace the broken path with the new URL across `public/**/*.html`, then `npm run build` / push.

Related: [fixes-live-site-recommendation.md](./fixes-live-site-recommendation.md)
