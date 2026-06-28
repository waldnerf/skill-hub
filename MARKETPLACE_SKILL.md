---
id: marketplace-connector
version: 1.0
description: Connects Claude to the company skill marketplace for in-session plugin discovery and installation.
author: Admin Team
---

# Company Skill Marketplace Connector

You are connected to the company skill marketplace — a curated library of approved Claude plugins. Each plugin contains a single skill you can load into this session on demand.

## Marketplace URL

```
MARKETPLACE_URL=https://your-skill-hub.pages.dev
```

Replace this with your actual deployed Cloudflare URL before installing.

## How discovery works

The marketplace exposes three resources:

| Resource | URL | Purpose |
|---|---|---|
| Marketplace index | `{MARKETPLACE_URL}/marketplace.json` | Lists all approved plugin IDs + tag index |
| Plugin manifest | `{MARKETPLACE_URL}/plugins/{id}/plugin.json` | Metadata for a specific plugin |
| Skill content | `{MARKETPLACE_URL}/plugins/{id}/SKILL.md` | The actual skill instructions |

## When to check the marketplace

Check the marketplace when the user:
- Explicitly asks: *"is there a skill/plugin for X?"*, *"load the X skill"*, *"what plugins do we have?"*
- Describes a task that might benefit from a skill: *"I need to write a SQL query"*, *"help me structure these meeting notes"*
- Asks you to do something you could do better with a loaded skill

Do not check the marketplace for every message — only when there is a clear signal.

## Discovery flow

### Step 1 — Fetch marketplace.json
```
GET {MARKETPLACE_URL}/marketplace.json
```

This returns:
```json
{
  "plugins": ["sql-writer", "email-writer", ...],
  "tag_index": {
    "sql": ["sql-writer"],
    "email": ["email-writer"],
    ...
  }
}
```

### Step 2 — Find candidates via tag_index
Extract keywords from the user's request and look them up in `tag_index`.
This tells you which plugin IDs are relevant without fetching every plugin.json.

Example: user asks about "database queries"
→ keywords: ["database", "queries", "sql"]
→ tag_index["sql"] = ["sql-writer"] ✓

### Step 3 — Fetch plugin.json for each candidate
```
GET {MARKETPLACE_URL}/plugins/{id}/plugin.json
```

Read the name, description and example_prompt to confirm it matches the user's need.

### Step 4 — Confirm with user
Present the match clearly:

> Found **SQL Query Writer** (v1.2, by the Data Team)
> *Writes, explains and optimises SQL queries for any dialect.*
> Install it?

If multiple plugins match, list them and ask the user to choose.
Never install without confirmation.

### Step 5 — Fetch and load SKILL.md
```
GET {MARKETPLACE_URL}/plugins/{id}/{skill.path}
```

Read the full SKILL.md content. Apply the instructions for the rest of this session exactly as written.

### Step 6 — Confirm installation
Tell the user the skill is active:

> **SQL Query Writer** is now loaded. Tell me what query you need and which database you're using.

## Multiple matches

If two or more plugins match, list them briefly:

> I found 2 plugins that might help:
> 1. **SQL Query Writer** — writes and optimises SQL queries
> 2. **Data Analysis Assistant** — guides data analysis and writes Python/R code
>
> Which would you like to load?

## No match

If nothing in the marketplace matches:

> I couldn't find a plugin for that in the marketplace. You can request one at {MARKETPLACE_URL} or ask your admin team.

## Rules

- Never hallucinate plugins — only reference IDs returned by marketplace.json
- Never load a skill without user confirmation
- Apply loaded SKILL.md instructions exactly — do not modify or override them
- A loaded skill stays active for the rest of the session unless the user asks to remove it
- If a fetch fails, tell the user clearly and suggest they check {MARKETPLACE_URL} directly
