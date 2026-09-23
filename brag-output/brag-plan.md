# Brag Plan: Fitness Future Gym

## What is this app?
A raw-iron powerlifting gym in Nangloi, Delhi (est. 2016) whose site swears it's "BUILT ON IRON, NOT GIMMICKS" — and which quietly ships a full member app: one-tap attendance, a set logger that throws a "NEW PR!" celebration, and a trophy case of every personal record.

## The angle
The gym's whole brand is anti-gimmick ("No fluff, no pastel spa amenities — just serious iron"). The video plays that straight, at trailer volume, then does one dry turn: **"OKAY. ONE GIMMICK."** — and shows the member dashboard doing exactly what a lifter wants and nothing else. The joke is the restraint: it's the only gimmick, and it's a barbell-shaped one (log the set → beat the number → it's on file).

Specific to this project because every line and every screen is the gym's own: its headline, its check-in copy, its real `New PR!` modal, its Personal Records page, its CTA.

## Hook (first 2-3 seconds)
Black. A metal-plate slam and **BUILT ON IRON,** lands in bone-white Bebas Neue. A second slam and **NOT GIMMICKS.** lands in molten orange. Verbatim from the site's philosophy section. Held ~1.6s so the whole line reads.

## Key moments (the middle)
- **The turn:** "OKAY. ONE GIMMICK." types out with key ticks, then a phone rises from the bottom of the frame.
- **Tap in:** on the member dashboard home, a finger taps the Attendance bar — the icon flips from `event_available` to `check_circle`, copy changes from "Tap to check in and unlock your dashboard" to "Marked — unlocked for 3h".
- **Log it → PR:** the Log A Set form fills in (Deadlift, 180 kg, 5 reps), Log Set is tapped, and the real PR celebration slams in: trophy, **NEW PR!**, "180kg × 5", "Up from 175kg × 5", **Keep Going**.
- **On file:** the Personal Records page — three rows land one by one (Deadlift, Bench Press, Back Squat), each `kg × reps` in orange.

## Outro / punchline
**SWEAT. / GAIN. / REPEAT.** slam word-by-word on the beat (the site's own hero), then the lockup: FITNESS FUTURE GYM, the real CTA "CLAIM YOUR 2-DAY FREE TRIAL", and "Nangloi · Delhi · fitnessfuturegym.in".

## User flow worth showing
Entry → key action → result, all from the member dashboard: **Tap to check in → Log a set → New PR / Personal Records.** (Source: `dashboard/page.tsx`, `AttendanceCheckInButton.tsx`, `WorkoutLogForm.tsx`, `PrCelebration.tsx`, `records/page.tsx`.)

## Tone
- Preset: cinematic
- Creative direction: "Iron-plate trailer for a gym with exactly one gimmick" — deadpan turn inside a blockbuster frame.
- Interpretation: Big condensed caps, hard cuts synced to beats and heavy plate impacts rather than soft crossfades; the one comedic beat ("ONE GIMMICK.") is played completely straight. Restraint in copy — every line is the gym's own.

## Format: vertical — 1080x1920
(Mobile-first product, members live on their phones, shared to Instagram/WhatsApp. Phone UI recreated at 2× so it reads. Re-render as landscape on request.)
## Duration: 22.4 seconds

## Visual identity (from the project)
- Background: #141311 (surface), deeper #0f0e0c
- Accent: #ff5a1f (molten signal-orange, `primary-container`)
- Text: #e7e2dd (`on-surface`), chalk-grey #ccc6bd (`tertiary`)
- Display font: Bebas Neue (headlines, big numbers)
- Body font: Oswald (labels, uppercase, tracked) + Inter (body)
- Strongest visual element: the hard-shadowed, square-cornered dashboard cards (`shadow-hard` 4px 4px 0 #000) and the orange-bordered "New PR!" modal with its glow.

## Share copy (draft)
Our gym's website says "no gimmicks." We built exactly one: log a set, beat your best, watch it throw a NEW PR. Fitness Future Gym, Nangloi.

## Audio direction
- Role: cinematic support — steady bed, heavy physical accents
- Music: `happy-beats-business-moves-vol-12` (steady, clean; ~110 BPM)
- Music treatment: starts at 0, ~0.30 volume, fades out over the last ~1.2s; ducks nothing (no voice)
- Music cue guidance: bundled preset read (`assets/music/cues/…vol-12…music-cues.md`), tempo 109.96 BPM. Strong cues used: **13.11s** (PR modal slam), **18.56s** (outro SWEAT slam). Beat grid used for hook slams, tap, and the three sequential record rows (reveal quickly, then hold the full set).
- Audio-reactive treatment: subtle; music RMS breathes the orange glow behind the phone and the PR modal halo. No waveform/equalizer visuals.
- SFX posture: moderate, motion-matched; metal-plate hits for slams, key ticks for the typed line, a click for the tap, a bell for the PR and the logo.
- Audio-coupled moments: typed "OKAY. ONE GIMMICK." (key ticks); tap on the attendance bar (click); Log Set tap → PR modal (bell on the 13.11 cue); records rows (soft drops); outro word slams + lockup (plate hits, bell).
- Restraint rule: no risers/whooshes stacked on top of the music; never more than one SFX family at once; nothing over the read-hold of a headline.

## Storyboard

### Scene 1 — Hook — 3.27s
Black frame fading up to the gym floor photo (`mobile-hero.jpg`) heavily darkened. Small tag: "FITNESS FUTURE GYM · NANGLOI · EST. 2016". **BUILT ON IRON,** slams in at 0.56s (bone white); **NOT GIMMICKS.** slams in at 1.64s (orange). Both held; total settled hold ≥ 1.6s.
Sequential/interaction: yes — two lines, one per beat (0.56s, 1.64s); the second line holds ~1.6s.
Audio intent: physical weight — two plate slams.
Audio-coupled idea: plate slam on each line landing.
Music: enters at 0, bed only.
Transition mood: hard cut → Scene 2

### Scene 2 — One gimmick + tap in — 6.02s
Black. "OKAY. ONE GIMMICK." types in (key ticks) at ~3.5s, holds ~1.7s, then exits upward as a square-cornered phone rises from the bottom of the frame (from ~5.3s) showing the member dashboard home: greeting "Good Evening / Prime time on the floor. Let's move.", the three orange quick-action tiles, and the Attendance bar. Caption above the phone: "TAP IN." + "No scanner. No queue." A finger touch-dot moves to the Attendance bar and taps at ~7.65s: icon flips to a check, copy becomes "Marked — unlocked for 3h". Held ~1.6s to read.
Sequential/interaction: yes — typed line; simulated tap on the Attendance bar (touch dot, press-scale, icon/copy swap).
Audio intent: dry turn, then a small satisfying click.
Audio-coupled idea: key ticks on typing; click SFX at the tap.
Transition mood: hard cut/slide → Scene 3

### Scene 3 — Log it, beat it — 6.0s
Phone screen swaps to "Log A Set". Fields fill in: Exercise "Deadlift" (typed), Weight 180, Reps 5. Caption above the phone: "LOG THE SET." → after the PR lands: "BEAT YOUR BEST." Finger taps **Log Set** at ~12.95s; at the 13.11s strong cue the PR celebration slams over the screen (blurred backdrop, orange-bordered card, trophy bounce, "Personal Record / New PR! / Deadlift / 180kg × 5 / Up from 175kg × 5 / Keep Going"). Holds ~2.1s.
Sequential/interaction: yes — typed exercise name, stepper values ticking, simulated Log Set tap.
Audio intent: build (small clicks) → release (bell) exactly on the cue.
Audio-coupled idea: bell on 13.11; ticks as fields fill.
Transition mood: hard cut → Scene 4

### Scene 4 — On file — 3.27s
Screen swaps to "Personal Records": trophy icon rows land one by one on beats (15.84, 16.38, 16.93): DEADLIFT 180kg × 5, BARBELL BENCH PRESS 100kg × 5, BACK SQUAT 140kg × 8. Caption: "EVERY PR. ON FILE." Reveal fast, full set held ~1.6s.
Sequential/interaction: yes — 3 rows, one per beat, then the set holds (reading-time floor respected).
Audio intent: soft, rhythmic confirmation.
Audio-coupled idea: a soft drop per row.
Transition mood: hard cut on the 18.56s strong cue → Scene 5

### Scene 5 — Outro — 3.84s
Black. **SWEAT.** (18.56s) **GAIN.** (19.10s, orange) **REPEAT.** (19.66s) slam in one per beat, stacked in the upper half. At 20.19s the lockup lands below: FITNESS FUTURE GYM, orange CTA "CLAIM YOUR 2-DAY FREE TRIAL", and "Nangloi · Delhi · fitnessfuturegym.in". Holds to 22.4s; music fades out.
Sequential/interaction: yes — three words on three beats (large display type, phrase fully visible ~2.7s), then lockup.
Audio intent: the biggest hits of the piece, then quiet.
Audio-coupled idea: plate slams on the three words; bell on the lockup.
Transition mood: end on hold + fade.

**Music mood for this video:** steady, clean, cinematic bed under heavy physical hits
**Audio summary:** A quiet bed under two plate slams, a dry key-tick turn, a click, one bell on the PR, soft drops for the trophy case, then three plate slams and a bell for the name.
