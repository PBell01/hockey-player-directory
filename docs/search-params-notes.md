# Search Params Notes

## Players search keys

- `position`: allowed values are `F`, `D`, `G`, or `all`
- `status`: allowed values are `active`, `ir`, or `all`

## Players defaults

- `position: 'all'`
- `status: 'active'`

## Games search keys

- `team`: trimmed uppercase team code or name; empty string by default
- `date`: `YYYY-MM-DD` only; invalid values fall back to `''`

## Games defaults

- `team: ''`
- `date: ''`

## Invalid values

Invalid or missing search values never throw. They are safely normalized by the shared validator and fall back to the route defaults.

## Example bookmark URLs

- `/players?position=F&status=active`
- `/games?team=TOR&date=2026-01-15`
