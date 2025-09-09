
# Task 1-3: Update Database Schema

**Related Feature:** `V2 [Core] - "Brain" Configuration Management`, `V2 [QA] - Test Case Registry Backend`

---

### 1. Objective
To modify the database creation script to include the new tables required to support Brain configurations and the QA Test Case Registry.

### 2. Scope of Work
- Modify the `scripts/create-tables.js` file.
- Add a `CREATE TABLE IF NOT EXISTS brains` statement.
  - The `brains` table should include columns for `id`, `name`, and a `config_json` (JSONB) field to store module namespaces.
- Add a `CREATE TABLE IF NOT EXISTS feature_tests` statement.
  - The `feature_tests` table should include columns for `id`, `featureId` (as a foreign key to the `features` table), `description`, `manual_steps`, and `expected_result`.
- Run the updated script against the development database to apply the changes.

### 3. Files to be Modified/Created
- `scripts/create-tables.js` (modified)

### 4. Acceptance Criteria
- [ ] The `scripts/create-tables.js` file contains the SQL statements for the new `brains` and `feature_tests` tables.
- [ ] After running the script, both new tables exist in the Vercel Postgres database schema.
- [ ] The foreign key relationship between `feature_tests` and `features` is correctly established.
