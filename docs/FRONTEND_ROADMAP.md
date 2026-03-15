# Frontend Roadmap

## Goal

The frontend must provide a focused single-page training experience where learners move from scenario selection to solving Git tasks without page reloads or context loss. It should make repository state, expected task goal, current answer, and feedback easy to compare on one screen.

For the MVP, the frontend should enable a learner to browse exercises, enter a training session, submit an answer, and understand the result through clear feedback and progress cues.

## Roadmap usage rules

- Items below should be suitable for creating issues.
- One task should produce a complete and testable frontend result.
- If a frontend item grows too large, convert it into a `parent issue` with `sub-issues`.
- Prefer issue sizes that can usually be implemented and reviewed in one focused PR.
- Prefer self-contained frontend tasks that can move forward from fixtures or stable contracts without waiting on unmerged sibling frontend work.
- If several frontend steps are only meaningful together as one screen or one interaction loop, keep them in one broader frontend task instead of chaining sibling tasks.

## Base UI constraints

- application type: SPA
- main work surface: training workspace with scenario panel, answer input area, and validation feedback panel
- responsive targets: desktop first, usable on tablet, basic support on mobile for reading and light interaction
- visual or accessibility constraints: keyboard-friendly input flow, high-contrast status states, no feedback conveyed by color alone, readable Git command typography

## MVP for frontend

Frontend MVP is complete when:

1. the learner can browse and filter the Git exercise catalog in one SPA flow
2. the learner can open an exercise and see task description, repository context, and answer input controls
3. the learner can submit an answer and receive clear validation feedback without leaving the page
4. the learner can see which exercises were completed and what to practice next

## Parent issues

### Parent Issue 1. Scenario catalog browsing frontend

Goal: provide the frontend slice needed for browsing and choosing exercises.

#### Sub-issue 1.1. Deliver catalog browsing UI against a swappable summary provider

Result: the frontend delivers the complete catalog browsing experience, including entry actions, filtering, and fallback states, against a provider boundary that can start local and later swap to a backend contract without redesigning the screen.

### Parent Issue 2. Exercise context and workspace frontend

Goal: provide the frontend slice needed to open an exercise and understand its context.

#### Sub-issue 2.1. Deliver exercise workspace UI against a swappable detail provider

Result: the frontend delivers the complete exercise context screen, including routing, repository cues, and fallback states, against a provider boundary that can start local and later swap to a backend contract without redesigning the workspace.

### Parent Issue 3. Submission and correctness frontend

Goal: provide the frontend slice needed for answer submission and first-pass correctness feedback.

#### Sub-issue 3.1. Deliver submission UI and correctness states against a swappable submission provider

Result: the frontend delivers the complete submission interaction loop, including input, pending states, request failures, and correctness summaries, against a provider boundary that can start local and later swap to a backend contract without redesigning the flow.

### Parent Issue 4. Guided retry and hints frontend

Goal: provide the frontend slice needed for instructional retries.

#### Sub-issue 4.1. Deliver retry and hint UX against a swappable feedback provider

Result: the frontend delivers the complete retry loop, including explanation rendering, preserved exercise context, and progressive hint reveal, against a provider boundary that can start local and later swap to a backend contract without redesigning the flow.

### Parent Issue 5. Progress and next-step guidance frontend

Goal: provide the frontend slice needed for visible progress and sensible follow-up guidance.

#### Sub-issue 5.1. Deliver progress surfaces against a swappable progress provider

Result: the frontend delivers the complete progress surface, including markers, recent work, unfinished work, summaries, and next-step recommendations, against a provider boundary that can start local and later swap to a backend contract without redesigning the UI.
