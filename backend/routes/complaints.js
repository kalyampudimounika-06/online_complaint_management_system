const router = require("express").Router();
const mongoose = require("mongoose");
const Complaint = require("../models/ComplaintModel");
const multer = require("multer");


function ensureDatabaseConnected(res) {

    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({
            message: "Database is currently unavailable. Please try again later."
        });

        return false;
    }

    return true;
}

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// CREATE COMPLAINT
router.post("/", upload.single("file"), async (req, res) => {
    try {

        if (!ensureDatabaseConnected(res)) {
            return;
        }

        console.log(req.body);
        console.log(req.file);

        const complaint = await Complaint.create({

            title: req.body.title,

            description: req.body.description,

            category: req.body.category,

            userId: req.body.userId,

            status: "Pending",

            file: req.file ? req.file.filename : null
        });

        res.json(complaint);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// GET ALL COMPLAINTS
router.get("/", async (req, res) => {
    try {

        if (!ensureDatabaseConnected(res)) {
            return;
        }

        const complaints = await Complaint.find();
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE STATUS
router.put("/:id", async (req, res) => {
    try {

        if (!ensureDatabaseConnected(res)) {
            return;
        }

        const updated = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;