# Hyperframes Composition Brief: Fitness Future Gym

## Objective
Create a short launch-style brag video for Fitness Future Gym.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 22.4 seconds

## Source Material
- Project root: `c:\Users\yash\Desktop\fitness future`
- Primary files read: `README.md`, `package.json`, `src/app/globals.css`, `design/v2/.../iron_signal/DESIGN.md`, `src/frontend/components/home/DesktopHome.tsx` + `MobileHome.tsx`, `src/app/dashboard/page.tsx`, `AttendanceCheckInButton.tsx`, `WorkoutLogForm.tsx`, `PrCelebration.tsx`, `PersonalRecordsBar.tsx`, `src/app/dashboard/records/page.tsx`, `src/frontend/lib/siteConfig.ts`
- Product name: Fitness Future Gym
- Tagline / strongest claim: "BUILT ON IRON, NOT GIMMICKS." / "SWEAT / GAIN / REPEAT"
- Key UI or visual moment to recreate: the member dashboard (Attendance bar → Log A Set → "New PR!" celebration → Personal Records list), in the site's square-cornered, hard-shadow Iron Signal style
- Copy that must appear verbatim:
  - BUILT ON IRON, NOT GIMMICKS.
  - Tap to check in and unlock your dashboard → Marked — unlocked for 3h
  - Personal Record / New PR! / Up from 175kg × 5 / Keep Going
  - SWEAT. GAIN. REPEAT.
  - CLAIM YOUR 2-DAY FREE TRIAL
  - Nangloi · Delhi · fitnessfuturegym.in

## Creative Direction
- Tone preset: cinematic
- Creative direction: "Iron-plate trailer for a gym with exactly one gimmick" — a deadpan turn inside a blockbuster frame.
- Interpretation: heavy condensed caps, hard cuts on the beat, metal-plate impacts instead of whooshes. The one comedic beat ("OKAY. ONE GIMMICK.") is played completely straight.
- Angle: the gym's site says "No fluff, no pastel spa amenities — just serious iron." The video keeps that promise at trailer scale, then admits it built one small gimmick: a dashboard that logs your set, throws a NEW PR when you beat your best, and keeps every record on file.
- Hook: black → plate slam "BUILT ON IRON," (white) → plate slam "NOT GIMMICKS." (orange), held ~1.6s.
- Outro / punchline: SWEAT. / GAIN. / REPEAT. on three beats, then the lockup with the real CTA.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign (no rounded pills, no gradients, no cyan/purple — the brand forbids them)

## Visual Identity
- Background: #141311 (surface) / #0f0e0c (lowest)
- Text: #e7e2dd (on-surface), #ccc6bd (tertiary)
- Accent: #ff5a1f (molten orange), pressed #a63500
- Display font: Bebas Neue
- Body font: Oswald (labels) + Inter (body)
- Visual references from the project: hard `4px 4px 0 #000` shadows, 0px radius, orange top/left accent rules, `PrCelebration` modal (orange 2px border + glow), `mobile-hero.jpg` gym photo, round gym badge `logo.jpeg`
- Fonts and the 14-icon Material Symbols subset are vendored locally in `composition/assets/fonts/`.

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3.27s — BUILT ON IRON, / NOT GIMMICKS. over darkened gym photo
2. One gimmick + tap in — 6.02s — "OKAY. ONE GIMMICK." typed; phone rises; tap on Attendance bar
3. Log it, beat it — 6.0s — Log A Set fills in; Log Set tapped; NEW PR! modal slams on the 13.11s cue
4. On file — 3.27s — Personal Records rows land on beats
5. Outro — 3.84s — SWEAT. GAIN. REPEAT. + lockup

## Audio
- Audio role: cinematic support — steady bed, heavy physical accents
- Audio arc: quiet bed → plate slams → key-tick turn → click → bell on the PR → soft drops → three plate slams + bell → fade
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (bundled, ~110 BPM)
- Music treatment: 0.30 volume, short fade-in, fade-out over the last ~1.1s
- Music cue guidance: bundled preset copied to `composition/assets/music/cues/`. Strong cues locked: 13.11s (PR modal), 18.56s (outro). Beat grid used for the hook slams, tap, three record rows, and outro words.
- Audio-reactive treatment: subtle — music RMS/bass (pre-extracted to `assets/audio-data.js`) drives an orange glow behind the phone/hook and the PR-modal halo via a CSS variable sampled per frame. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Hook — plate slam per line
  - "OKAY. ONE GIMMICK." — typed, key ticks
  - Attendance tap — click at the touch
  - Log A Set typing / values — key ticks; Log Set tap — click
  - PR modal — bell on 13.11s
  - Records rows — soft drop per row
  - Outro — plate slam per word, bell on lockup
- SFX selection guidance: physical (plate/bell) for weight, low-HF clicks for UI, soft drops for list rows. Nothing bright or repeated.
- Exact SFX choice: chosen against the implemented animation (see `index.html`).
- Audio files: copied into `composition/assets/`.

## Hyperframes Instructions
Domain skills used: `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. /brag workflow, not the generic promo route.

Requirements:
- Show real UI/copy from the source project (dashboard flow above).
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds (22.4s).
- Include the planned music/SFX layer.
- Run `hyperframes check` before render.
