# Clearmix

**Peptide Reconstitution Calculator**

Mix and measure with confidence.

![Version](https://img.shields.io/badge/version-0.3.0--pre-blue)
![Status](https://img.shields.io/badge/status-Release%20Candidate-orange)

## Overview

Clearmix is a web-based calculator that helps users accurately reconstitute peptide vials and calculate precise dosing. The tool guides users through the math of mixing bacteriostatic water with peptide powder and determining the correct syringe draw volume for their prescribed dose.

## Features (v0.3.0-pre)

### 🛡️ Input Validation & Safety (New)
- **Smart Logic**: Prevents unsafe inputs (e.g., zero/negative values).
- **Vial Safety**: Clamps maximum vial amount to 30mg to prevent magnitude errors.
- **Dose Warnings**: Alerts users to unusually high doses (>500mcg info, >1000mcg warning).
- **Water Limits**: Guides users to stay within standard 1-10mL reconstitution volumes.

### Two-Screen Mode
- **Mixing Screen**: Calculate how to reconstitute your peptide vial
- **Dosing Screen**: Calculate the exact draw volume for your dose

### Visual Syringe Meter
- Horizontal scale visualization showing exactly where to draw
- Dynamic tick marks that adjust based on syringe size (0.3, 0.5, 1.0, 3.0 mL)
- Clear "draw to X units" guidance

### Smart Draw Calculations
- Automatically calculates multiple draws when volume exceeds syringe capacity
- Shows simple recommendations (e.g., "6 × 0.3 mL + 1 × 0.2 mL")

### User-Friendly Design
- Preset buttons for common values (5, 10, 15 mg vials; 1, 2, 3 mL water)
- Micrograms (mcg) for doses, milligrams (mg) for vials
- Inline examples for clarity
- Dark mode, medical-tech inspired UI

## Tech Stack

- **Backend**: Python/Flask
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Styling**: Custom CSS design system (no frameworks)
- **Testing**: Pytest (Automated Unit Tests)

## Getting Started

### Prerequisites
- Python 3.12+
- pip

### Installation

```bash
cd execution
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Running Locally

```bash
source .venv/bin/activate
python run.py
```

Access at: http://127.0.0.1:5000

## Project Structure

```
ClearMix/
├── directives/          # Product requirements and specifications
│   └── prd.md          # Product Requirements Document
├── execution/           # Application code
│   ├── app/
│   │   ├── static/     # CSS, JS assets
│   │   └── templates/  # HTML templates
│   ├── tests/          # Test suite
│   └── run.py          # Entry point
├── orchestration/       # Build reports and progress tracking
└── README.md
```

## Disclaimer

**⚠️ This tool provides math and measurement guidance only. It does not provide medical advice. Always confirm dosing with your prescriber.**

## Roadmap

- [x] Phase 1: Core calculator with two-screen mode
- [x] Phase 1.5: Comprehensive Input Validation & Safety
- [ ] Phase 2: Syringe visual enhancement
- [ ] Phase 3: Mobile responsiveness
- [ ] Phase 4: Local storage for preferences
- [ ] Phase 5: A/B testing and analytics

## License

Private - All rights reserved.
