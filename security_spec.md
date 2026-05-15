# Firestore Security Specification

### 1. Data Invariants
- A user can only be created with their own `uid`.
- An asset must have `createdBy` equal to the user creating it.
- Only admins can list users or delete an asset.
- Audit logs are append-only. No updates or deletions are permitted.

### 2. The "Dirty Dozen" Payloads
1. **Create User Spoofed UID**: Denied by `request.auth.uid == userId`.
2. **Read User Profile**: Anonymous or unverified users denied.
3. **List Users as non-admin**: Denied.
4. **Update User Role as Employee**: Denied by `hasOnly(['updatedAt'])` for non-admin.
5. **Create Asset with missing required field**: Denied by `hasAll` in `isValidAsset`.
6. **Update Asset and change code**: Denied by `hasOnly` not containing `code`.
7. **Create Audit Log for non-existent asset**: Denied by `exists()` check.
8. **Update Audit Log**: Denied by `allow update: if false`.
9. **Delete Audit Log**: Denied by `allow delete: if false`.
10. **Admin Update User Role**: Permitted due to `isAdmin()`.
11. **Employee get Asset**: Permitted.
12. **Employee list Assets**: Permitted.

### 3. Test Runner
We have evaluated the logic and tested via `@firebase/eslint-plugin-security-rules`.
