# Migration Requests

**For P2 and P3 only**

If you need a database migration, create a request file here. P1 will merge it into the numbered migration sequence.

## Format

```markdown
# Migration Request: [Brief Title]

**Requested by:** P2 or P3
**Date:** YYYY-MM-DD

## Tables Needed

[SQL CREATE TABLE statements]

## Indexes

[SQL CREATE INDEX statements]

## Notes

[Any additional context or constraints]
```

## Example

See `example_request.md` in this directory.

## Process

1. Create your request file: `p2_my_feature.md` or `p3_my_feature.md`
2. Commit and push
3. Notify P1 in Slack/Discord
4. P1 will merge it into `database/migrations/XXX_your_feature.sql`
5. P1 will notify you when it's ready
