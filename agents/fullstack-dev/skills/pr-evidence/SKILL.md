---
name: pr-evidence
description: Show reviewers of an info.altinn.no pull request what a change does, with the checks that ran and screenshots of the pages or the Umbraco backoffice it changes. Use before opening or updating a pull request.
---

# Show the change to reviewers

A reviewer knows only the pull request and its issue, and should see what changed without running it.

## What to show

- **The checks you ran**, for each part the change touches, as the agent's instructions list them, and their outcome.
  Put a failing or skipped check, and why, in the body too.
- **A screenshot of each page or component the change alters**, before and after when the difference matters. It
  takes the `desktop` agent. On `minimal`, say which screenshots are missing and that the `desktop` agent can take them.
  - A page: run `pnpm dev` in `astro-infoportal`, which serves `http://localhost:4321` with content from the AT22
    Umbraco unless `.dev.vars` points it at a local one, as its README says. Before you start it, run
    `pnpm exec astro preferences disable devToolbar` there once, which keeps Astro's toolbar off the page. It is saved
    in `.astro/`, which Git ignores. Dismiss the consent banner the page opens with, unless the change is to it.
  - A component: the page that shows it. The repository has a `storybook` script, but no Storybook configuration or
    stories, so it does not start.
  - Umbraco: the backoffice of a local Umbraco, as the `local-umbraco` skill describes.
- **A recording** only when the change is a flow that a screenshot cannot show, such as a menu or a form. Make it as
  the `recording` skill describes.

Take a still with `playwright-cli screenshot --filename=page.png` at a desktop width, and again at a phone width when
the layout changes with it.

- Keep artifacts under `/home/agent/code/.artifacts/<task>/`, outside the checkout, and never commit them.
- Show test content only, and no secrets, tokens or personal data.
- Keep each file within 10 MiB.
- Give each image a caption in the body: which page, at which width, before or after.

## Attach

Write the body with local references to the files, and run `gh` from the artifact directory with one `--attach` per
file. It uploads them and rewrites the references to hosted URLs. After pushing the branch:

```sh
gh pr create --repo Altinn/info.altinn.no --base main --head <branch> \
  --title '...' --body-file pr-body.md --attach ./after.png
gh pr edit <number> --attach ./after.png
```

A failed upload can still have created or updated the pull request, so look at it before retrying, and retry missing
files with `gh pr edit`. Read the body back with `gh pr view <number> --json body -q .body` and check that every
attachment has a hosted URL.
