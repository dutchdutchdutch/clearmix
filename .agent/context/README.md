# Agent Context

Architecture diagrams following the [C4 Model](https://c4model.com/) convention.

## Files

| File | C4 Level | Purpose |
|------|----------|---------|
| `c4-container.mmd` | Container | Deployable units: Flask, Freeze, Firebase |
| `c4-component.mmd` | Component | Internal modules: routes, templates, static |

## Usage

- **Agent:** Read these before exploring code to understand structure.
- **Human:** Render with any Mermaid-compatible tool (VS Code, GitHub, etc.)

## Maintenance

Update diagrams when:
- Adding new containers (services, databases, external APIs)
- Restructuring internal modules
- Changing deployment flow

*Last updated: Feb 2, 2026*
