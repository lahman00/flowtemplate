# Banner Post-Upload QA Checklist

Status: **CLOSED — V3 LIVE AND QA PASSED (2026-08-19).** Eyal uploaded V3 to the LinkedIn Company Page and confirmed it passed live QA. The former native-file-picker blocker is resolved; no further banner action is required.

The completed QA sequence is retained below as the regression checklist for any future replacement:

1. Navigate to `linkedin.com/company/141163964` (member view, not admin) and screenshot the banner at desktop width.
2. Confirm: headline text fully visible, not cut off at either edge; not overlapped by the logo (bottom-left).
3. Resize the browser to mobile width (375px) and reload.
4. Screenshot the mobile-rendered banner.
5. Confirm: same two checks as step 2, but at mobile's narrower visible crop — this is the check that actually failed before the fix, so don't skip it.
6. If either check fails: don't accept "technically fits" — go back to `app/api/social/linkedin-banner/route.tsx` (kept in the repo for exactly this), adjust text size/position, re-render, re-send the file, repeat from step 1.
7. If both pass: record the replacement version and live-QA date in `MILOOSH_SOCIAL_BRAND_STANDARD.md`.
8. Capture final evidence (both screenshots) for the record — same standard as every other visual verification this session.
