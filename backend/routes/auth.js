const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = require("express").Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");


// ================= REGISTER =================
router.post("/register", async (req, res) => {

    try {

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

        // Reset URL
        const resetURL =
            `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

        // Email Transport
        const testAccount =
            await nodemailer.createTestAccount();

        const transporter =
            nodemailer.createTransport({

                host: "smtp.ethereal.email",

                port: 587,

                auth: {

                    user: testAccount.user,

                    pass: testAccount.pass
                }
            });

        // Send Mail
        const info = await transporter.sendMail({

            from: testAccount.user,

            to: user.email,

            subject: "Password Reset",

            html: `

                <h2>Password Reset</h2>

                <p>
                    Click below to reset password:
                </p>

                <a href="${resetURL}">
                    Reset Password
                </a>
            `
        });

        console.log(
            "Preview URL:",
            nodemailer.getTestMessageUrl(info)
        );
        res.json({
            message: "Reset link sent to email"
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