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
+               return c.body(null, 200);
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

TODO

## 3. System Tests

Testing all the api routes using **vitest** and **cloudflare’s vitest plugin**.

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

TODO

## Testing limitations and future

TODO