# Make LinkedIn bridge contract

Miloosh remains the scheduler and source of truth. Make must not schedule, rewrite, select, or deduplicate editorial content.

## Inbound webhook request to Make

Method: `POST`; content type: `application/json`.

Headers:

- `Authorization: Bearer <MAKE_LINKEDIN_WEBHOOK_SECRET>`
- `Idempotency-Key: linkedin:<postId>`
- `X-Miloosh-Timestamp: <Unix milliseconds>`
- `X-Miloosh-Signature: sha256=<HMAC-SHA256(secret, timestamp + "." + exact-body)>`

Body:

```json
{
  "postId": "stable Miloosh queue UUID",
  "idempotencyKey": "linkedin:<same UUID>",
  "text": "final formatted copy including publication-time UTM URL",
  "url": "publication-time UTM URL",
  "scheduledAt": "ISO-8601 timestamp or null",
  "organizationId": "141163964",
  "organizationUrn": "urn:li:organization:141163964"
}
```

The Make scenario must validate the bearer secret, timestamp freshness, and signature before its LinkedIn module. It must store or check `idempotencyKey` before creating a post.

## Synchronous response

Confirmed publication:

```json
{"status":"published","executionId":"...","linkedinPostId":"...","linkedinPostUrl":"..."}
```

Accepted but not confirmed:

```json
{"status":"accepted","executionId":"..."}
```

Definite failure:

```json
{"status":"failed","executionId":"...","error":"safe diagnostic"}
```

Only `published` with a non-empty `linkedinPostId` is recorded as published.

## Asynchronous result callback

Method: `POST https://miloosh.com/api/social/make/linkedin-result`

Header: `Authorization: Bearer <MAKE_LINKEDIN_WEBHOOK_SECRET>`.

The body uses `postId`, `idempotencyKey`, `status`, `executionId`, `linkedinPostId`, `linkedinPostUrl`, and `error` with the same meanings above. `status` must be `published` or `failed`; a published callback requires `linkedinPostId`.
