# User-based Access Control Migration

## Migration Steps

1. Create `user_access_points` table (see 008_create_user_access_points.sql)
2. Migrate all card-based access to user-based (see 009_migrate_card_access_to_user_access.sql)
3. Drop old `card_access_points` table (see 010_drop_card_access_points.sql)

## Testing
- Run all unit and E2E tests after migration.
- Verify card scan → user lookup → user access rights.

## API Changes
- All access assignment now via `/users/:user_id/access-points` endpoints.
- Card registration always requires user assignment.

## Rollback
- Restore `card_access_points` and revert migration scripts if needed.
