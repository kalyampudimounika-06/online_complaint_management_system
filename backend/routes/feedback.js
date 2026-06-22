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

module.exports = router;