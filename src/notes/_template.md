---
# Copy this file to src/notes/<slug>/note.md (the folder name becomes the URL: /notes/<slug>/).
# Fill in the fields, write the body, then run python3 scripts/refresh_content.py.
title: Keeping secrets out of Terraform state
# Optional: exact, case-sensitive title phrases to colour with the theme accent.
# A single string works too: emphasis: Terraform state
emphasis:
  - Terraform state
summary: One or two sentences. Used under the title, in the notes archive, and in link previews.
date: 2026-11-02
tags: terraform, security
# draft = listed in the archive as "in the works", no page yet. publish = full page.
status: publish
tldr: The one thing a reader should remember, in a sentence or two.
---

## The problem

What broke or was slow, and who felt it. One or two sentences a stranger could follow.

## Context

Just enough background. Numbers beat adjectives: "14 AWS accounts", not "a lot of accounts".

## The choices

| Option | Good | Not so good |
| --- | --- | --- |
| Do nothing | Free today | Keeps costing time |
| Build a small script | Fits exactly | You own it now |

## What happened

Show the work:

```sh
terraform plan -out=tfplan
```

> A lesson worth pulling out.

Images: put them next to the draft in src/notes/<slug>/ and reference the actual filename. Example syntax:

```markdown
![alt text](diagram.png)
```

## What I'd do next

- What you'd change with hindsight.
- What's still open.
