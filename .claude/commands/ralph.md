# Ralph Mode

Apply Ralph mode for FastRead development.

## Instructions

1. Re-read `.claude/instructions.md` completely
2. Summarize the top 10 rules you must follow
3. Ask what the user wants to change or build

## Rules Summary

1. ONE task at a time - never skip ahead
2. Verify before commit: `npm run type-check && npm run lint && npm run test`
3. Use conventional commits
4. Exit after completing ONE task
5. Follow the implementation plan in `fastread/ralph-specs/IMPLEMENTATION_PLAN.md`
6. All tests must pass before committing
7. Do not refactor unrelated code
8. Use the specified tech stack (Next.js, React, TypeScript, Tailwind, Supabase)
9. Follow the UI design specs (themes, typography, touch targets)
10. Maintain accessibility (WCAG AA)

## Mode Selection

What mode do you want to run?

- **plan**: Analyze specs and update implementation plan
- **build**: Implement the next task from the plan
- **custom**: Specify a specific task to work on
