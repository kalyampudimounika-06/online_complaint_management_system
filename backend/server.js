const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

const bcrypt = require("bcryptjs");

const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/online-complaint-management-system";
const MONGO_OPTIONS = {
    serverSelectionTimeoutMS: 3000
};

let serverStarted = false;

function startServer() {

    if (serverStarted) {
        return;
    }

    serverStarted = true;

    app.listen(PORT, () => {

        console.log(
            `Server running on port ${PORT}`
        );

    });
}

async function createAdmin() {

    try {

        const adminExists = await User.findOne({
            email: "admin@gmail.com"
        });

        if (!adminExists) {

            const hashedPassword =
                await bcrypt.hash("admin123", 10);

            await User.create({

                name: "Admin",

                email: "admin@gmail.com",

                password: hashedPassword,

                role: "admin"
            });

            console.log("Default admin created");
        }

    } catch (err) {

        console.log(err);
    }
}

// ================= MIDDLEWARE =================

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// ================= STATIC FOLDER =================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

const feedbackRoutes =
require("./routes/feedback");

app.use(
    "/api/feedback",
    feedbackRoutes
);


// ================= ROUTES =================

app.use(
    "/api/complaints",
    require("./routes/complaints")
);

app.use(
    "/api/auth",
    require("./routes/auth")
);


// ================= MONGODB CONNECTION =================

async function connectToMongo() {

    const candidateUris = [MONGO_URI, LOCAL_MONGO_URI].filter(Boolean);
    let lastError = null;

    for (const uri of candidateUris) {

        try {
            console.log(process.env.MONGO_URI);
            await mongoose.connect(uri, MONGO_OPTIONS);

            console.log(`MongoDB Connected: ${uri}`);

            await createAdmin();

            return true;

        } catch (err) {

            lastError = err;

            console.warn(`Failed to connect to MongoDB: ${uri}`);

            console.warn(err.message);

        }

    }

    if (!candidateUris.length) {

        console.warn(
            "No MongoDB URI configured. Starting server without a database connection."
        );

        return false;

    }

    console.warn(
        "All MongoDB connection attempts failed. Starting server without a database connection."
    );

    if (lastError) {
        console.warn(lastError.message);
    }

    return false;
}

(async () => {

    await connectToMongo();

    startServer();

})();