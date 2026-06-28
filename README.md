# Skill Hub

An internal marketplace for company-approved Claude skills. Browse, discover, and install skills directly into your Claude sessions.

---

## What is this?

Skill Hub lets your team browse approved Claude skills, install any skill into Claude by copying a single prompt, and let Claude discover skills automatically when asked. No backend, no database, no cost.

---

## Repository structure

```
skill-hub/
├── public/
│   ├── skills-registry.json        ← Source of truth for all skills
│   └── skills/
│       └── [skill-id]/SKILL.md     ← One folder per skill
├── src/                            ← React + Vite marketplace UI
├── scripts/
│   └── validate-registry.js        ← CI validation (runs before every deploy)
├── MARKETPLACE_SKILL.md            ← Install once in Claude for auto-discovery
└── .github/
    ├── workflows/deploy.yml        ← CI/CD: validates + deploys on merge
    └── pull_request_template.md    ← Checklist for skill PRs
```

---

## Run locally

```bash
git clone https://github.com/your-org/skill-hub
cd skill-hub
npm install
npm run dev
```

Open `http://localhost:5173`. To validate the registry alone: `npm run validate`

---

## Add a skill

Each new skill needs two things:

**1. The skill file** at `public/skills/[skill-id]/SKILL.md`

**2. An entry in `public/skills-registry.json`:**

```json
{
  "id": "skill-id",
  "name": "Human-readable name",
  "description": "What this skill enables Claude to do.",
  "category": "Data",
  "tags": ["tag1", "tag2"],
  "author": "Team name",
  "version": "1.0",
  "approved": true,
  "added": "2026-01-15",
  "skill_url": "/skills/skill-id/SKILL.md",
  "example_prompt": "An example of what a user would ask"
}
```

Valid categories: `Data`, `Productivity`, `Communication`, `Strategy`

Skills with `"approved": false` are hidden from the marketplace.

---

## Skill submission workflow (via PR)

```
Contributor creates branch
  → adds SKILL.md + registry entry
  → opens pull request

CI runs automatically:
  → validates registry (required fields, no duplicates, file exists)
  → builds the site
  → posts a preview URL to the PR

Admin reviews skill on preview URL
  → merges PR

Cloudflare deploys to production in ~30 seconds
```

---

## CI/CD pipeline

Defined in `.github/workflows/deploy.yml`. On every push:

| Event | Result |
|-------|--------|
| Pull request | Validate → Build → Preview URL on PR |
| Merge to `main` | Validate → Build → Production deploy |
| Validation fails | Build blocked, PR cannot merge |

The validator checks: required fields, no duplicate IDs, valid category, tags is array, SKILL.md file exists.

---

## One-time Cloudflare setup

1. Push repo to GitHub
2. Go to pages.cloudflare.com → Create project → Connect to Git → select repo
3. Build command: `npm run build` | Output directory: `dist`
4. Add two GitHub repo secrets (Settings → Secrets → Actions):
   - `CLOUDFLARE_API_TOKEN` — from Cloudflare Dashboard → API Tokens
   - `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare Dashboard sidebar

---

## Enable in-session skill discovery

So Claude can automatically find and load skills during a conversation:

1. Open `MARKETPLACE_SKILL.md` and replace `REGISTRY_URL` with your deployed URL
2. Place it at `/mnt/skills/user/skill-hub/SKILL.md`

Users can then ask Claude: *"Is there a skill for writing SQL?"* and Claude will check the hub, confirm the match, and load it immediately.

---

## FAQ

**Do I need to rebuild when I add a skill?** Yes — push to `main` and Cloudflare rebuilds in ~30 seconds.

**How do I unpublish a skill quickly?** Set `"approved": false` in the registry — it disappears on next deploy. No need to delete the file.

**Can I version skills?** Yes — increment the `version` field in both the registry entry and the SKILL.md frontmatter.

**Can the site be restricted to internal users?** Yes — use Cloudflare Access (free tier) to add email-based authentication in front of the site.
