const crypto = require("crypto");

const router = require("express").Router();
const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");


function ensureDatabaseConnected(res) {

    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({
            message: "Database is currently unavailable. Please try again later."
        });

        return false;
    }

    return true;
}


// ================= REGISTER =================
router.post("/register", async (req, res) => {

    try {

        if (!ensureDatabaseConnected(res)) {
            return;
        }

        const { name, email, password, role } = req.body;

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user"
        });

        res.json({
            message: "Registration successful"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {

    try {

        if (!ensureDatabaseConnected(res)) {
            return;
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // Compare password
        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            "secretkey",
            {
                expiresIn: "1d"
            }
        );

        // Response
        res.json({
            token,
            role: user.role,
            name: user.name,
            userId: user._id
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {

    try {

        if (!ensureDatabaseConnected(res)) {
            return;
        }

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        // Generate Token
        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        user.resetToken = resetToken;

        user.resetTokenExpire =
            Date.now() + 15 * 60 * 1000;

        await user.save();

        // Generate Reset URL
        const resetURL =
            `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

        // Return URL directly
        res.json({

            message: "Reset link generated",

            resetURL
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            error: err.message
        });
    }
});
// ================= RESET PASSWORD =================
router.post("/reset-password/:token", async (req, res) => {

    try {

        if (!ensureDatabaseConnected(res)) {
            return;
        }

        const user = await User.findOne({

            resetToken: req.params.token,

            resetTokenExpire: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        // Hash New Password
        const hashedPassword = await bcrypt.hash(
            req.body.password,
            10
        );

        user.password = hashedPassword;

        user.resetToken = undefined;

        user.resetTokenExpire = undefined;

        await user.save();

        res.json({
            message: "Password reset successful"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
});