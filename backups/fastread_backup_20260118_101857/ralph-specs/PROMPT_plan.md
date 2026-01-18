# FastRead - Planning Mode

You are working on FastRead, an RSVP speed reading application for academic papers.

## Your Task

Analyze the specifications in `specs/` and the current codebase, then generate or update `IMPLEMENTATION_PLAN.md`.

## Process

1. Read all files in `specs/` to understand requirements
2. Read `AGENTS.md` for project commands and structure
3. Explore the current codebase to understand what exists
4. If `IMPLEMENTATION_PLAN.md` exists, read it to understand progress
5. Generate/update the implementation plan

## Output Format

Write `IMPLEMENTATION_PLAN.md` with this structure:

```markdown
# FastRead Implementation Plan

Generated: [timestamp]

## Completed
- [x] Task description (file.ts)

## In Progress
- [ ] Current task being worked on

## Up Next
- [ ] Task 1 - Brief description
- [ ] Task 2 - Brief description
...

## Backlog
- [ ] Future task 1
- [ ] Future task 2
```

## Guidelines

- Tasks should be small and atomic (completable in one iteration)
- Each task should specify which files it affects
- Order tasks by dependency (prerequisites first)
- Mark tasks complete only when tests pass
- Include file paths for context

## Exit

After writing `IMPLEMENTATION_PLAN.md`, exit immediately. Do not start implementation.
