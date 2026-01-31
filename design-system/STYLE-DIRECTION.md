# Clearmix Design Direction: Deep Indigo + Mint

> **Status:** Approved  
> **Date:** 2026-01-30  
> **Reference Mockup:** Final V1 (Deep Indigo consolidated)

---

## Design Philosophy

**Target Users:** Athletes using peptides at home  
**Tone:** Friendly, approachable, guiding — not clinical or intimidating  
**Aesthetic:** Clean, flat, consolidated — minimal visual blocks

---

## Color Palette

### Primary Colors

| Role | Hex | Usage |
|------|-----|-------|
| **Background** | `#1e1b4b` | Deep indigo — main app background |
| **Card Background** | `#2e2a5e` | Slightly lighter indigo for cards |
| **Accent Primary** | `#34D399` | Mint green — active states, CTAs, sliders |
| **Accent Secondary** | `#A78BFA` | Lavender — subtle highlights, secondary elements |

### Text Colors

| Role | Hex | Usage |
|------|-----|-------|
| **Primary Text** | `#FFFFFF` | Headlines, results, important values |
| **Secondary Text** | `#C4B5FD` | Descriptions, labels, hints |
| **Muted Text** | `#8B8BA3` | Tertiary info, placeholders |

### Semantic Colors

| Role | Hex | Usage |
|------|-----|-------|
| **Success** | `#34D399` | Confirmation, valid states |
| **Warning** | `#FBBF24` | Caution alerts, validation hints |
| **Error** | `#F87171` | Error states, blocking validation |

---

## Typography

### Font Family
**Recommended:** Barlow / Barlow Condensed (athletic, friendly)  
**Fallback:** Inter, system sans-serif

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap');

:root {
  --font-display: 'Barlow Condensed', sans-serif;
  --font-body: 'Barlow', sans-serif;
}
```

### Type Scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| App Title | 32px | 700 | Display |
| Tagline | 16px | 400 | Body |
| Section Title | 18px | 600 | Body |
| Preset Buttons | 16px | 600 | Body |
| Result Value | 48px | 700 | Display |
| Result Unit | 20px | 500 | Body |
| Body Text | 14px | 400 | Body |

---

## UI Components

### Mode Toggle
- Pill-shaped toggle switch
- Active state: Mint green indicator dot
- Position: Below header, centered

### Preset Buttons (5mg, 10mg, 15mg)
- Pill/rounded rectangle shape
- **Well-spaced** — generous horizontal gaps
- Inactive: Dark indigo border, secondary text
- Active: Mint border, white text, subtle mint fill

### Slider
- Horizontal track with mint green fill
- Large circular thumb for easy touch
- Value displayed above slider
- Range labels at ends (0 mL, 10 mL)

### Result Display
- Large mint-colored number (e.g., "2.5")
- Unit in white/secondary ("mg/mL")
- Positioned prominently within card

### Illustrations
- Simple, friendly line illustrations
- Syringe icon near results
- Use mint + lavender accent colors
- Not realistic/medical — approachable style

### Cards
- Single consolidated card per screen when possible
- Subtle border (lavender or lighter indigo)
- Rounded corners (12-16px)
- Internal sections separated by spacing, not borders

---

## Layout Principles

1. **Consolidated blocks** — Fewer visual sections on screen
2. **Generous spacing** — Large gaps between interactive elements
3. **Large touch targets** — Minimum 44px tap areas
4. **Prominent results** — Calculation output is the hero

---

## Key Improvements from Current Design

| Current | New Direction |
|---------|---------------|
| Emoji icons (🧪💉) | SVG line illustrations |
| Cyan accent (#00d4ff) | Mint green (#34D399) |
| Multiple separate cards | Single consolidated card |
| Inter font | Barlow / Barlow Condensed |
| Dark blue-gray (#0a0e14) | Deep indigo (#1e1b4b) |

---

## Reference Mockup

![Final V1 - Deep Indigo Consolidated](/Users/dutch/.gemini/antigravity/brain/8413192a-f58c-4e03-945e-6dffeff1fa98/indigo_mint_final_v1_1769807629669.png)

---

## Next Steps

- [ ] Update CSS custom properties with new palette
- [ ] Replace emoji icons with SVG illustrations
- [ ] Switch to Barlow font family
- [ ] Consolidate card layout in templates
- [ ] Implement slider for water volume input
