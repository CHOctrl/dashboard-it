🧹 [code health improvement] Deduplicate stats calculation in DashboardStats

🎯 **What:**
Replaced the local `useMemo` calculation of deployment stats in `DashboardStats.tsx` with a call to `getStats()` from the `PCContext`.

💡 **Why:**
This removes duplicate business logic. The logic for aggregating stats by branch was present in both `PCContext` (via `getStats`) and `DashboardStats`. Consolidating it in the context improves maintainability and ensures consistency.

✅ **Verification:**
- Ran `python3 verification/verify_dashboard.py` before and after the change. Both passed successfully.
- Manually verified the code logic matches exactly.
- Ran `pnpm lint` to ensure code style compliance.

✨ **Result:**
Codebase is cleaner with centralized logic for stats calculation.
