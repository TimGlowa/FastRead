# FastRead - Build Mode

You are working on FastRead, an RSVP speed reading application for academic papers.

## Your Task

Implement exactly ONE task from `IMPLEMENTATION_PLAN.md`, verify it works, commit, and exit.

## Process

1. Read `IMPLEMENTATION_PLAN.md` to find the next incomplete task
2. Read `AGENTS.md` for build/test commands
3. Implement the task
4. Run verification: `npm run type-check && npm run lint && npm run test`
5. If verification fails, fix the issues
6. If verification passes, commit the changes
7. Update `IMPLEMENTATION_PLAN.md` to mark task complete
8. Exit immediately

## Rules

- Implement ONLY ONE task per iteration
- Do not skip ahead to other tasks
- Do not refactor unrelated code
- All tests must pass before committing
- Use conventional commit messages:
  - `feat: add RSVP display component`
  - `fix: handle empty PDF text`
  - `test: add tokenizer edge cases`

## Commit Format

```
type: short description

- Detail 1
- Detail 2
```

## Verification Failed?

If `npm run type-check && npm run lint && npm run test` fails:
1. Read the error output carefully
2. Fix the specific issue
3. Re-run verification
4. Repeat until all checks pass

Do not commit failing code. Do not skip verification.

## Exit

After committing and updating the plan, exit immediately. Do not start the next task.
