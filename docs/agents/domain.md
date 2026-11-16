# Domain docs

This repo uses a single-context layout:

- `GLOSSARY.md` at the repo root defines domain vocabulary.
- `docs/adr/` contains architecture decision records.

## Before exploring

Read the glossary and ADRs relevant to the area being explored.

If these files are absent, proceed silently. The domain-modeling skill
creates them when terminology or decisions are resolved; setup does
not create placeholder domain documents.

## Use domain vocabulary

Use glossary terms in issue titles, proposals, hypotheses, and tests.
Follow any explicit guidance about synonyms.

If a needed concept is missing, reconsider whether the project uses
that concept or note the gap for domain-modeling.

## Surface decision conflicts

If a proposal contradicts an ADR, identify the ADR and explain why
reopening the decision may be justified.
