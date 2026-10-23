# Release pipeline

```
task branch → pull request → CI "verify" → auto-merge (owner PRs) → main → Vercel production
                    └──────── Vercel preview deployment ────────┘
```

## CI (`.github/workflows/ci.yml`)

CI runs on every pull request into `main` and every push to `main`. It has
one job, **`verify`**:

The job runs in the official `mcr.microsoft.com/playwright:v1.63.0-noble`
image, which already has Chromium and its system libraries, so CI never
installs packages through apt. A step fails the job if `@playwright/test`
no longer matches the image tag.

1. `npm ci` from the committed `package-lock.json`, with the npm cache
2. `ffprobe` from the pinned `ffprobe-static@3.1.0` npm package, for the
   media resolution test
3. `next typegen` (route types for `PageProps`), then `npm run typecheck`
4. `npm run lint`
5. `npm test` (Vitest; Google, Supabase and PayMongo are mocked)
6. `npm run build`, once
7. Playwright, against `next start` on port 3100 serving that same build.
   Playwright starts this server itself and never reuses one it did not
   start.

A new push to a pull request cancels that pull request's older run. Runs on
`main` always finish. CI uses no secrets: checkout is unconfigured there, so
the end-to-end tests cover its unavailable state and input guards.

## Branch rule on `main`

A repository **ruleset** named "main: CI required" applies to `main`:

- it requires the **`verify`** check from GitHub Actions to pass. Branches do
  not need to be up to date first, so auto-merge does not stall when `main`
  moves;
- it blocks deleting `main` and force-pushing to it.

Repository admins (the owner) are bypass actors. So the owner can still push
straight to `main`, as before. No review requirement existed before, and
none was added: a solo owner cannot approve their own pull request.

## Auto-merge (`.github/workflows/auto-merge.yml`)

When a pull request is opened, reopened or marked ready for review, the
workflow requests **auto-merge (squash)**. It only does so when all of the
following are true:

- the author is `cjlonzaga29-pixel` and is the repository **OWNER**;
- the head branch is in this repository (not a fork);
- the base branch is `main`;
- the pull request is not a draft;
- `main` still has a ruleset that requires `verify`. Without that rule,
  auto-merge would merge at once, so the workflow refuses.

GitHub then merges the pull request only after `verify` passes, and only if
the head is still the commit the workflow saw. The workflow uses the built-in
token with `contents: write` and `pull-requests: write`. It needs no personal
token, approves nothing, and never checks out or runs pull-request code. It
uses `pull_request`, not `pull_request_target`.

Other contributors' pull requests and fork pull requests still get CI, but
they are never auto-merged.

Merges made by the workflow token do not start new workflow runs, so CI does
not run again on `main` after an auto-merge. The pull request's `verify` run
already tested that change. Direct pushes to `main` do run CI.

## Deployment (Vercel Git integration)

The Vercel project `auraderm` (team `cjlonzaga29-pixels-projects`) is
connected to this repository, and its production branch is `main`:

- Every push to another branch gets a **preview** deployment.
- Every commit that lands on `main` deploys to **production**
  (https://auraderm-gamma.vercel.app).

There is no `vercel --prod` job in GitHub Actions, and none should be added:
the Git integration already deploys.

**What is gated.** Vercel does not wait for GitHub CI. A commit pushed
straight to `main` (an admin bypass) deploys at once, even if CI later fails
on it. Production is gated by CI only when a change goes through a pull
request: the ruleset and auto-merge keep the change off `main` until
`verify` passes. Use pull requests for anything that should be checked
before it goes live.

Database migrations are never run by CI or deployment. They are applied by
hand to Supabase project `brrydhnpwkfejehksdkn` only (see
`docs/checkout-setup.md`).
