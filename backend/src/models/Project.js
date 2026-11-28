const mongoose = require("mongoose");

const { Schema } = mongoose;

const projectSchema = new Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    goal: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, trim: true, maxlength: 120, default: "Team Workspace" },
    status: {
        type: String,
        enum: ["Active", "In Review", "Blocked", "Completed"],
        default: "Active"
    },
    deadline: { type: Date, default: null },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    members: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Project", projectSchema);
