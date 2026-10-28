# Muscle colour audit — 2026-10-28

Audited app source: ca507d44bbde50415eb23b4235bee72fa1630f9c.

- 34 exercises, all 102 fixed camera presets, two sampled phases each: 204 software-rendered views reviewed.
- 64 animation phases per exercise: 2,176 checks that animation preserves the selected vertex colours.
- Checked red and orange separately against target metadata, exact palette values, uncoloured extremities, highlight toggling, exercise changes while highlights are disabled, and GPU colour-buffer update flags.
- Production rig, motion metadata and viewer JavaScript match the audited source. Build passes.

No colour-data loss, unexpected palette values, or stale colour after switching/toggling was found.

Visibility limitations remain: outer-hip highlights are mostly hidden in the front view of side leg raises; back highlights are hidden in frontal pull-ups; the abdomen is partly occluded in downward-facing floor exercises. Occlusion is not a missing vertex colour, and should not be addressed by colouring unrelated visible skin.

Highlights are fixed muscle-participation regions for the exercise cycle. They do not represent instantaneous left/right recruitment or measured activation intensity. Mesh regions are approximate skin-surface masks, not segmented anatomical muscles.

This audit uses CPU skinning and software-rendered images. It does not verify WebGL lighting, tone mapping or rendering on a physical iPhone.

Reproduce:

```sh
node scripts/check-muscle-highlights.mjs
BODYWEIGHT_POSE_OUTPUT=/tmp/bodyweight-color-audit node scripts/export-3d-stills.mjs
BODYWEIGHT_POSE_OUTPUT=/tmp/bodyweight-color-audit python scripts/render-muscle-audit.py
npm run build
```

The audit renderer writes review sheets to the selected output directory and does not replace app thumbnails.
