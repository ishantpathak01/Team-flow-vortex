const { Router } = require("express");
const { isObjectIdOrHexString } = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const Project = require("../models/Project");
const User = require("../models/User");

const router = Router();
const projectFields = new Set(["name", "goal", "category", "status", "deadline"]);

function fail(res, status, message) {
    return res.status(status).json({ success: false, message });
}

function handle(handler) {
    return (req, res, next) => Promise.resolve()
        .then(() => handler(req, res))
        .catch(next);
}

function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function projectInput(body) {
    if (!isObject(body) || !Object.keys(body).length) return null;

    for (const [field, value] of Object.entries(body)) {
        if (!projectFields.has(field)) return null;
        if (field === "deadline") {
            if (value === null) continue;
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
            const date = new Date(value);
            if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== value) return null;
        } else if (typeof value !== "string" || !value.trim()) {
            return null;
        }
    }

    return body;
}

function ownerFilter(req) {
    return { _id: req.params.projectId, owner: req.user._id };
}

function sendProject(res, project, status = 200) {
    if (!project) return fail(res, 404, "Project not found");
    return res.status(status).json({ success: true, project });
}

router.use(authMiddleware);
router.param("projectId", (req, res, next, projectId) => {
    if (!isObjectIdOrHexString(projectId)) return fail(res, 400, "Invalid project ID");
    next();
});

router.post("/", handle(async (req, res) => {
    const fields = projectInput(req.body);
    if (!fields) return fail(res, 400, "Invalid project fields. Use YYYY-MM-DD for deadline");
    const project = await Project.create({ ...fields, owner: req.user._id });
    return sendProject(res, project, 201);
}));

router.get("/:projectId", handle(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.projectId,
        $or: [{ owner: req.user._id }, { members: req.user._id }]
    });
    return sendProject(res, project);
}));

router.patch("/:projectId", handle(async (req, res) => {
    const fields = projectInput(req.body);
    if (!fields) return fail(res, 400, "Invalid project fields. Use YYYY-MM-DD for deadline");
    const project = await Project.findOneAndUpdate(
        ownerFilter(req), { $set: fields }, { new: true, runValidators: true }
    );
    return sendProject(res, project);
}));

router.delete("/:projectId", handle(async (req, res) => {
    const project = await Project.findOneAndDelete(ownerFilter(req));
    if (!project) return fail(res, 404, "Project not found");
    return res.status(204).end();
}));

router.post("/:projectId/members", handle(async (req, res) => {
    const { userId } = req.body ?? {};
    if (typeof userId !== "string" || !isObjectIdOrHexString(userId)) {
        return fail(res, 400, "Invalid member user ID");
    }
    const filter = ownerFilter(req);
    if (!(await Project.exists(filter))) return fail(res, 404, "Project not found");
    if (userId.toLowerCase() === String(req.user._id)) {
        return fail(res, 400, "The project owner already has access");
    }
    if (!(await User.exists({ _id: userId }))) return fail(res, 404, "User not found");

    const project = await Project.findOneAndUpdate(
        filter, { $addToSet: { members: userId } }, { new: true }
    );
    return sendProject(res, project);
}));

router.delete("/:projectId/members/:userId", handle(async (req, res) => {
    if (!isObjectIdOrHexString(req.params.userId)) return fail(res, 400, "Invalid member user ID");
    const project = await Project.findOneAndUpdate(
        ownerFilter(req), { $pull: { members: req.params.userId } }, { new: true }
    );
    if (!project) return fail(res, 404, "Project not found");
    return res.status(204).end();
}));

router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.name === "ValidationError") return fail(res, 400, error.message);
    console.error("Project operation failed:", error.name);
    return fail(res, 500, "Project operation failed");
});

module.exports = router;
