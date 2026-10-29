# Dumbbell integration fixes — 2026-10-29

- Unified 0–60 kg normalization; 0 hides the gear and remains 0 through messages and suggestions. Model size increases through 60 kg; UI states geometry is illustrative.
- Bounds sample actual skinned body, hair and 60 kg gear at 40 phases, cached separately for normal/wrong/correct modes. Weight edits reuse the conservative bounds.
- Shared dumbbell uses two explicit grip contact points instead of a left-hand-only attachment. Chest, overhead and hip targets are solved independently; hip bell is horizontal.
- Renegade-row support hands have gear clearance, instead of inheriting flat-palm floor targets.
- Fault comparisons use neutral skin plus the fault overlay. Muscle legend is hidden and muscle toggle disabled until exiting comparison mode.
- Each dumbbell rep set requires an actual rep count before completion. Counts are saved alongside weights. Progression requires all planned sets/reps, one consistent nonzero weight, and explicit per-set data; mixed weights use the lightest completed weight as the next baseline. Legacy records do not auto-progress. Suggestions are capped at 60 kg.
- Exported thumbnails now include default hair and actual attached gear.

Validation: build; 48 exercises × 128 hand poses; 14 gear exercises × 4 weights × 64 phases; all three camera presets at three aspect ratios for maximum gear; four skins × seven fault modes × 16 phases; weight progression and legacy cases. Hair A/B/C geometry is checked for finite coordinates. Software-rendered stills reviewed.

The tests do not certify anatomical accuracy, every skin/mesh collision, or frame rate on a physical iPhone. Camera fitting may add loading work; cached mode bounds avoid repeating it each animation loop.
