const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, ".env") });

// Import database connection
const db = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth");
const equipmentRoutes = require("./routes/equipment");
const rentalRoutes = require("./routes/rental");
const bookingRoutes = require("./routes/booking");
const feedbackRoutes = require("./routes/feedback");
const userRoutes = require("./routes/user");
const vendorRoutes = require("./routes/vendor");
const adminRoutes = require("./routes/admin-working");
const customerRoutes = require("./routes/customer");

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (for uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/api/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        message: "Agriculture Equipment Rental System API is running",
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);

// Demo routes showing role-based access control
const demoRoutes = require("./routes/demo");
app.use("/api/demo", demoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});

// Catch-all 404 route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Agriculture Equipment Rental System Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("SIGINT received. Shutting down gracefully...");
    process.exit(0);
});

module.exports = app;
