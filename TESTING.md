# TE7 - Testing

## 1. Test-Driven Development Documentation

Fixing a bug where deleting groups returned the group instead of Status 204 with an empty body. 

First, I wrote a failing test that deletes a group and expects the status of 204. 
```ts
it("deletes a group", async () => {
    const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
    const res = await api.delete(`/api/groups/${createdGroupId}`, { headers });
    expect(res.status).toBe(204);
});
```
```
 FAIL  test/groups.test.ts > groups routes > deletes a group
AssertionError: expected 200 to be 204 // Object.is equality

- Expected
+ Received

- 204
+ 200

 ❯ test/groups.test.ts:368:22
    366|   const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
    367|   const res = await api.delete(`/api/groups/${createdGroupId}`, { headers });
    368|   expect(res.status).toBe(204);
       |                      ^
    369|  });
    370|
```

Then, I edited the DELETE /api/groups route to change the behavior

```diff
        .delete("/:groupId", validateGroupParam, async (c) => {
                const { user } = c.var.session;
 
-               const res = await db
+               await db
                        .delete(schema.group)
                        .where(and(eq(schema.group.id, c.var.groupId), eq(schema.group.ownerId, user.id)))
-                       .returning();
 
-               return c.json(firstOrNotFound(res, "Group Not Found") as Group);
+               return c.body(null, 204);
        })
```
And the test passed.
```
     ✓ deletes a group 14ms
```

BUT, then a previous test started to fail. It expected the delete route to return 404 (fail when you do not have permission to access the group), but it was now returning 204 (success) 

```
 FAIL  test/groups.test.ts > groups routes > fails to delete a group whom you are not the owner of
AssertionError: expected 204 to be 404 // Object.is equality

- Expected
+ Received

- 404
+ 204

 ❯ test/groups.test.ts:361:22
    359|   const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
    360|   const res = await api.delete("/api/groups/group00000000001", { headers });
    361|   expect(res.status).toBe(404);
       |                      ^
    362|   expect(await res.json()).toStrictEqual({ message: "Not Found" });
    363|  });
```
This needed me to refactor. 

This issue turned out to be caused by code not knowing if the sql command succeeded or not because it was no longer returning anything. 

The following fix was needed: 
```diff
        .delete("/:groupId", validateGroupParam, async (c) => {
                const { user } = c.var.session;
 
-               await db
+               const res = await db
                        .delete(schema.group)
                        .where(and(eq(schema.group.id, c.var.groupId), eq(schema.group.ownerId, user.id)))
+                       .returning();
+
+               if (res.length == 0) throw new HTTPException(404, { message: "Not Found" });
 
                return c.body(null, 204);
        })
```
So now if the group was not actually deleted, nothing is returned by the command and an error can be thrown.

Finally, all the tests passed.
```
 ✓ test/groups.test.ts (39 tests) 378ms
 ✓ test/trips.test.ts (45 tests) 436ms

 Test Files  3 passed (3)
      Tests  85 passed (85)
```

## 2. Unit Tests

Unit tests exercise individual rules in isolation, without making API requests or using a database. Vitest runs these tests in `packages/api/test/validation.test.ts` against two shared validators. These rules protect item data and ensure a grocery item has a valid set of people sharing it.

| Unit | Case | Expected result |
| --- | --- | --- |
| Item validator | Price is zero | Accepted |
| Item validator | Price is negative | Rejected |
| Item validator | Name is empty | Rejected |
| Item-share validator | Two different users have shares | Accepted |
| Item-share validator | No users have shares | Rejected |
| Item-share validator | A user has two share entries | Rejected |

Run the unit tests with:

```bash
pnpm --filter @grocery-split/api exec vitest run test/validation.test.ts
```

## 3. System Tests

System tests use **Vitest** and **Cloudflare's Vitest plugin** to exercise API routes, authentication, and the database together, such as creating and retrieving a group or rejecting a deletion by a non-owner.

Setup (if you haven't already):
```bash
pnpm install
```

Run tests (database will be migrated & seeded automatically):
```bash
cd packages/api
pnpm run test
```
## 4. UI Tests

Browser tests using **Playwright** (Chromium). They open the real React app in a real browser, click and type like a user, and check what is shown on the page. They run against the **real API and a real local database** (the same seed data as the API tests), so nothing is mocked.

### User stories covered

**#16 - As a roommate, I want to create a household group so that I can manage grocery purchases with the people I live with.** (`e2e/groups.spec.ts`)
- A signed out visitor who opens `/groups` is sent to the sign in page.
- A signed in user only sees the groups they belong to.
- A user creates a group, sees it in My Groups, and it is still there after a refresh (saved to the database).

**#22 - As a roommate, I want to specify which roommates are sharing a grocery item so that people are only charged for items they use.** (`e2e/shopping-list.spec.ts`)
- A user adds an item, picks a roommate to share it with, and sees it in the list (still there after a refresh).
- A user tries to add an item that nobody is sharing, sees the error message, and the item is not saved.

### How signing in works

The app only supports Google sign in, which a test can't automate. Instead, the tests use a test-only API route, `POST /api/test/login` (`packages/api/src/routes/testing.ts`). It uses better-auth's `testUtils` plugin (the same one the API tests use for `getAuthHeaders`) to create a real session for a seeded user and returns its cookie, which the test gives to the browser (`signInAs` in `e2e/fixtures.ts`).

The `testUtils` plugin is only loaded when `MODE=test`, so in dev and production this route always returns `404 Not Found`.

### Test database and servers

Playwright starts everything itself (`packages/react-frontend/playwright.config.ts`):
1. `e2e/reset-db.ts` deletes and recreates the test database, then migrates and seeds it with the db package's seed script. The tests use their own database folder (`packages/api/.wrangler/e2e`), so your dev database is never touched.
2. The API starts in test mode on `http://localhost:8788`.
3. The frontend starts on `http://localhost:5174`, pointed at that API.

Different ports from `pnpm dev` are used, so the tests can run while the dev servers are running. No `.env` values are needed for the tests.

Setup (if you haven't already):
```bash
pnpm install
cd packages/react-frontend
pnpm exec playwright install chromium
```

Run tests:
```bash
cd packages/react-frontend
pnpm run test          # headless
pnpm run test:headed   # watch the browser click through the tests
pnpm run test:ui       # step through each test in Playwright's UI
```

Example output:
```
Running 5 tests using 1 worker

  ✓  1 [chromium] › e2e\groups.spec.ts:6:2 › my groups › sends a signed out visitor to the sign in page (1.9s)
  ✓  2 [chromium] › e2e\groups.spec.ts:13:2 › my groups › shows a signed in user only the groups they belong to (819ms)
  ✓  3 [chromium] › e2e\groups.spec.ts:24:2 › my groups › creates a group that is still there after a refresh (1.1s)
  ✓  4 [chromium] › e2e\shopping-list.spec.ts:12:2 › group shopping list › adds an item shared with a roommate (1.3s)
  ✓  5 [chromium] › e2e\shopping-list.spec.ts:36:2 › group shopping list › won't add an item that nobody is sharing (1.2s)

  5 passed (33.1s)
```

## Running every test

From the repo root, `npm test` or `pnpm test` runs the `test` script of every package (API tests, then browser tests). Both commands require pnpm to be installed and available on your PATH.

## Testing limitations and future

- **UI tests:** Google sign in itself isn't tested, since tests sign in through the test-only route.
- **UI tests:** Only Chromium is tested. Firefox and WebKit could be added as extra Playwright projects.
- **UI tests:** The tests share one database that is reset once per run, so they run one at a time and each test uses its own item and group names.
- **Future UI tests:** joining a group with an invite code, creating a trip, and editing or deleting items.
