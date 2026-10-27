---
# Copy this file to drafts/<slug>.md (the file name becomes the URL: /notes/<slug>/).
# Fill in the fields, write the body, then ask Somi to publish it.
title: Keeping secrets out of Terraform state
# Optional: the last few words of the title to set in the accent italic. Leave blank to let Somi pick.
emphasis: Terraform state
summary: One or two sentences. Used under the title, in the notes archive, and in link previews.
date: 2026-11-02
tags: terraform, security
# draft = listed in the archive as "in the works", no page yet. publish = full page.
status: publish
tldr: The one thing a reader should remember, in a sentence or two.
---

<!-- Every "## heading" becomes a section and an entry in the "on this page" list.
     Suggested shape: problem, context, choices, what happened, what I'd do next.
     Keep it public-safe: no incident or security specifics, internal names, or anything a former team wouldn't want shared. -->

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

Images: put them next to the draft in drafts/<slug>/ and reference them as ![alt text](diagram.png).

## What I'd do next

- What you'd change with hindsight.
- What's still open.
