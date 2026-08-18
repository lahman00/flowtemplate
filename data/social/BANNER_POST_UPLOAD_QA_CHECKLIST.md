# Banner Post-Upload QA Checklist

Status: **BLOCKED_HUMAN_FILE_PICKER** — banner file built, QA'd, and delivered directly to Eyal. Browser automation cannot reach LinkedIn's native OS file-picker dialog, so the upload itself requires Eyal to do it manually (Edit Page → Page info tab → pencil icon on Banner → select the delivered file).

Run this exact sequence the moment Eyal confirms the upload is done — don't wait for a separate prompt.

1. Navigate to `linkedin.com/company/141163964` (member view, not admin) and screenshot the banner at desktop width.
2. Confirm: headline text fully visible, not cut off at either edge; not overlapped by the logo (bottom-left).
3. Resize the browser to mobile width (375px) and reload.
4. Screenshot the mobile-rendered banner.
5. Confirm: same two checks as step 2, but at mobile's narrower visible crop — this is the check that actually failed before the fix, so don't skip it.
6. If either check fails: don't accept "technically fits" — go back to `app/api/social/linkedin-banner/route.tsx` (kept in the repo for exactly this), adjust text size/position, re-render, re-send the file, repeat from step 1.
7. If both pass: update `MILOOSH_SOCIAL_BRAND_STANDARD.md`'s banner section to note it's live, and this checklist file can be deleted.
8. Capture final evidence (both screenshots) for the record — same standard as every other visual verification this session.
