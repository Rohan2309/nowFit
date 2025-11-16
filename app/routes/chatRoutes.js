const router = require("express").Router();
const Chat = require("../models/chatMessage");
const User = require("../models/user");

// ===========================
// CLIENT – OPEN CHAT WITH COACH
// ===========================
router.get("/client", async (req, res) => {
    try {
        const user = req.user;

        if (!user.coachAssigned) {
            return res.send("No coach assigned!");
        }

        const receiver = await User.findById(user.coachAssigned);
        const messages = await Chat.find({
            $or: [
                { from: user._id, to: user.coachAssigned },
                { from: user.coachAssigned, to: user._id }
            ]
        }).sort({ timestamp: 1 });

        res.render("chat/chat", { user, receiver, messages });

    } catch (err) {
        console.log("Chat Route Error:", err);
        res.send("Something went wrong.");
    }
});

// ===========================
// COACH – LIST ALL ASSIGNED CLIENTS
// ===========================
router.get("/coach/clients", async (req, res) => {
    try {
        const coach = req.user;

        // Fetch all users assigned to this coach
        const clients = await User.find({ coachAssigned: coach._id });

        res.render("chat/coachClients", { coach, clients });

    } catch (err) {
        console.error("Coach Clients Error:", err);
        res.send("Error loading clients.");
    }
});

// ===========================
// COACH – CHAT WITH A SPECIFIC CLIENT
// ===========================
router.get("/coach/:clientId", async (req, res) => {
    try {
        const coach = req.user;
        const clientId = req.params.clientId;

        const receiver = await User.findById(clientId);
        if (!receiver) return res.send("Invalid client ID");

        const messages = await Chat.find({
            $or: [
                { from: coach._id, to: clientId },
                { from: clientId, to: coach._id }
            ]
        }).sort({ timestamp: 1 });

        res.render("chat/chat", {
            user: coach,
            receiver,
            messages
        });

    } catch (err) {
        console.log("Chat Route Error:", err);
        res.send("Something went wrong.");
    }
});

module.exports = router;
