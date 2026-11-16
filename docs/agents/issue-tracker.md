# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `kiriland/FindMyStudents`.
Use the `gh` CLI from this clone.

Before the first issue creation in a session, run
`gh repo view --json nameWithOwner` and verify the target is
`kiriland/FindMyStudents`. If it differs, resolve the target before writing.

## Conventions

- Create: `gh issue create --title "..." --body-file <file>`.
  Write multiline bodies to a temporary file first.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,body,labels,assignees`.
  Add label and state filters as needed.
- Edit: `gh issue edit <number> --body-file <file>`.
- Comment: `gh issue comment <number> --body-file <file>`.
- Labels: `gh issue edit <number> --add-label "..." --remove-label "..."`.
  Use the mappings in `docs/agents/triage-labels.md`.
- Close: post the explanation as a comment, then run
  `gh issue close <number>`. Post comments separately even if already closed.

## Parent issues and blockers

Create sub-issues with `gh issue create --parent <parent> ...`,
or link existing issues with
`gh issue edit <parent> --add-sub-issue <child>`.

Add native dependencies with
`gh issue edit <child> --add-blocked-by <blocker>`.
A ticket is startable when all blockers are closed.

Count open blockers with:
`gh api repos/kiriland/FindMyStudents/issues/<number> --jq .issue_dependencies_summary.blocked_by`.

If native relationships are unavailable, put `Part of #<parent>`
and `Blocked by: #<number>` at the top of the child body, and add
children to a task list in the parent.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Skill operations

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the issue and its comments.

## Wayfinding operations

- Map: one issue labelled `wayfinder:map` containing Notes,
  Decisions-so-far, and Fog.
- Child tickets: link as sub-issues and label `wayfinder:<type>`,
  where type is `research`, `prototype`, `grilling`, or `task`.
- Frontier: choose the first open child in map order with no assignee
  and no open blockers.
- Claim: `gh issue edit <number> --add-assignee @me`.
- Resolve: comment with the result, close the child, and append a
  summary and link to the map's Decisions-so-far.
