const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const jwt = require("jsonwebtoken");
const { Types } = require("mongoose");
const app = require("../src/app");
const Project = require("../src/models/Project");
const User = require("../src/models/User");
const TokenBlacklist = require("../src/models/TokenBlacklist");

test("project API enforces membership and owner-only writes", async (t) => {
    const owner = new Types.ObjectId();
    const member = new Types.ObjectId();
    const outsider = new Types.ObjectId();
    const projectId = new Types.ObjectId();
    const ids = [owner, member, outsider].map(String);
    const secret = "project-test-only-signing-secret";
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
    t.after(() => {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });

    t.mock.method(TokenBlacklist, "findOne", async () => null);
    t.mock.method(User, "findById", (id) => ({
        select: async () => ids.includes(id) ? { _id: new Types.ObjectId(id) } : null
    }));
    t.mock.method(User, "exists", async ({ _id }) => ids.includes(_id));

    let stored;
    const matchesOwner = (filter) => stored
        && String(filter._id) === String(projectId) && String(filter.owner) === String(owner);
    t.mock.method(Project, "create", async (fields) => {
        const project = new Project({ ...fields, _id: projectId });
        await project.validate();
        stored = project;
        return stored;
    });
    t.mock.method(Project, "findOne", async (filter) => {
        if (!stored || filter._id !== String(projectId)) return null;
        assert.equal(String(filter.$or[0].owner), String(filter.$or[1].members));
        const userId = String(filter.$or[0].owner);
        return userId === String(owner) || stored.members.some((id) => String(id) === userId)
            ? stored : null;
    });
    t.mock.method(Project, "exists", async (filter) => Boolean(matchesOwner(filter)));
    t.mock.method(Project, "findOneAndUpdate", async (filter, update, options) => {
        if (!matchesOwner(filter)) return null;
        assert.equal(options.new, true);
        if (update.$set) {
            assert.equal(options.runValidators, true);
            const updated = new Project({ ...stored.toObject(), ...update.$set });
            await updated.validate();
            stored = updated;
        }
        if (update.$addToSet) stored.members.addToSet(update.$addToSet.members);
        if (update.$pull) stored.members.pull(update.$pull.members);
        return stored;
    });
    t.mock.method(Project, "findOneAndDelete", async (filter) => {
        if (!matchesOwner(filter)) return null;
        const deleted = stored;
        stored = null;
        return deleted;
    });

    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const base = "http://127.0.0.1:" + server.address().port + "/api/projects";
    const target = "/" + projectId;
    const members = target + "/members";
    const memberPath = members + "/" + member;
    const request = async (method, path, user, body, status) => {
        const headers = { "Content-Type": "application/json" };
        if (user) headers.Authorization = "Bearer " + jwt.sign({ id: String(user) }, secret);
        const response = await fetch(base + path, {
            method, headers, body: JSON.stringify(body), signal: AbortSignal.timeout(5000)
        });
        const content = await response.text();
        assert.equal(response.status, status, method + " " + path + " " + content);
        return content ? JSON.parse(content) : null;
    };

    await request("GET", target, null, undefined, 401);
    await request("GET", "/bad-id", owner, undefined, 400);
    await request("POST", "", owner, { name: "Missing goal" }, 400);
    await request("POST", "", owner, { name: "Lab", goal: "Build", deadline: "2026-02-30" }, 400);
    const created = await request("POST", "", owner, {
        name: " Lab ", goal: "Build", deadline: "2026-12-01"
    }, 201);
    assert.equal(created.project.name, "Lab");
    assert.equal(created.project.owner, String(owner));
    assert.equal(created.project.deadline, "2026-12-01T00:00:00.000Z");
    await request("GET", target, outsider, undefined, 404);
    await request("GET", target, owner, undefined, 200);
    await request("PATCH", target, owner, { owner: String(outsider) }, 400);
    await request("PATCH", target, owner, { status: "Unknown" }, 400);
    const updated = await request("PATCH", target, owner, { status: "Completed", deadline: null }, 200);
    assert.equal(updated.project.status, "Completed");
    assert.equal(updated.project.deadline, null);

    await request("POST", members, outsider, { userId: String(member) }, 404);
    await request("POST", members, owner, { userId: String(new Types.ObjectId()) }, 404);
    await request("POST", members, owner, { userId: String(owner) }, 400);
    const added = await request("POST", members, owner, { userId: String(member) }, 200);
    assert.deepEqual(added.project.members, [String(member)]);
    const retried = await request("POST", members, owner, { userId: String(member) }, 200);
    assert.deepEqual(retried.project.members, [String(member)]);
    await request("GET", target, member, undefined, 200);
    await request("PATCH", target, member, { name: "Unauthorized" }, 404);
    await request("DELETE", target, member, undefined, 404);
    await request("DELETE", memberPath, member, undefined, 404);
    await request("DELETE", memberPath, owner, undefined, 204);
    await request("DELETE", memberPath, owner, undefined, 204);
    await request("GET", target, member, undefined, 404);
    await request("DELETE", target, owner, undefined, 204);
    await request("GET", target, owner, undefined, 404);
});
