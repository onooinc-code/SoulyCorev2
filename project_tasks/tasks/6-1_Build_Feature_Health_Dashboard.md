
# Task 6-1: Build Feature Health Dashboard

**Related Feature:** `V2 [UI] - Feature Health Dashboard UI`

---

### 1. Objective
To implement the "Feature Health Dashboard" as a new tab within the SoulyDev Center to display the status of all system features and their associated tests.

### 2. Scope of Work
- Create a new component, `components/dev_center/FeatureHealthDashboard.tsx`.
- This component will fetch data from both `/api/features` and `/api/tests`.
- It will join this data to display a table or grid view of all features from the `FeaturesDictionary`.
- For each feature, it will show an overall health status (e.g., 🟢, 🟡, 🔴) based on the pass/fail status of its associated tests.
- Clicking on a feature will expand to show the list of its specific test cases.

### 3. Files to be Modified/Created
- `components/dev_center/FeatureHealthDashboard.tsx` (created)
- `components/dev_center/DevCenter.tsx` (modified to add the new tab)

### 4. Acceptance Criteria
- [ ] A new "Feature Health" tab is available in the Dev Center.
- [ ] The tab displays a list of all features registered in the dictionary.
- [ ] The UI correctly calculates and displays a health status for each feature.
- [ ] The user can view the specific test cases associated with each feature.
