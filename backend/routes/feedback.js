const router = require("express").Router();

const Feedback =
    require("../models/Feedback");

router.post("/", async (req, res) => {

    try {

        const {
            rating,
            complaintId,
            feedback
        } = req.body;

        await Feedback.create({

            rating,
            complaintId,
            feedback

        });

        res.json({
            message:
            "Feedback submitted successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
});

router.get("/", async (req, res) => {

    try {

        const feedbacks =
            await Feedback.find()
            .sort({ createdAt: -1 });

        res.json(feedbacks);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;