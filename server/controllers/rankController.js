import KeywordTracking from "../models/KeywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js";

// Add a keyword to track 
export const addKeyword = async (req,res) => {
    try {
        const {keyword, url} = req.body

        if(!keyword || !keyword.trim() || !url) return res.status(400).json({
            success: false,
            message: "Keyword and URL are required"
        });

        // Extract domain from URL
        let domain;
        try {
            const urlObj = new URL(url.startsWith("http")? url : `https://${url}`);
            domain = urlObj.hostname.replace(/^www\./, '');
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid URL"
            });
        }

        // Check if the keyword is already being tracked for this user and domain
        const existingKeyword = await KeywordTracking.findOne({ userId: req.userId, keyword: keyword.toLowerCase().trim(), domain });
        if (existingKeyword) {
            return res.status(400).json({
                success: false,
                message: "This keyword is already being tracked for the specified domain."
            });
        }

        // Create new keyword tracking entry
        const newKeywordTracking = await KeywordTracking.create({
            userId: req.userId,
            keyword: keyword.toLowerCase().trim(),
            url: url.startsWith("http") ? url : `https://${url}`,
            domain,
            status: "checking"
        });


        res.status(201).json({
            success: true,
            message: "Keyword added for tracking successfully",
            tracking: newKeywordTracking
        });
        keywordTracking(newKeywordTracking).catch((err) => console.error("Keyword tracking error:", err.message)); // Start tracking in the background


    } catch (error) {
        console.error("Add keyword error:", error.message);
        if(error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "This keyword is already being tracked for the specified domain."
            });
        }
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }

}

// Get all tracked keywords for user
export const getKeywords = async (req, res) => {
    try {
        const keywords = await KeywordTracking.find({ userId: req.userId }).sort({ createdAt: -1 }).select("-rankHistory");
        res.status(200).json({ success: true, keywords });
    } catch (error) {
        console.error("Get keywords error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }

}

// Get single keyword with full history
export const getKeyword = async (req, res) => {
    try {
        const tracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        if(!tracking) {
            return res.status(404).json({ success: false, message: "Keyword tracking not found" });
        }
        res.status(200).json({ success: true, tracking });
    } catch (error) {
        console.error("Get keyword error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }

}

// Manually refresh a keyword ranking
export const refreshKeyword = async (req, res) => {
    try {
        const tracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        if (!tracking) {
            return res.status(404).json({ success: false, message: "Keyword tracking not found" });
        }
        tracking.status = "checking";
        await tracking.save();
        res.status(200).json({ success: true, message: "Rank check started" });
        keywordTracking(tracking).catch((err) => console.error("Keyword tracking error:", err.message));
    } catch (error) {
        console.error("Refresh keyword error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }

}

// Delete keyword tracking
export const deleteKeyword = async (req, res) => {
    try {
        const tracking = await KeywordTracking.findByIdAndDelete({ _id: req.params.id, userId: req.userId });
        if (!tracking) {
            return res.status(404).json({ success: false, message: "Keyword tracking not found" });
        }

        res.status(200).json({ success: true, message: "Keyword tracking deleted" });

    } catch (error) {
        console.error("Delete keyword error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }

}

// Toggle tracking active/inactive 
export const toggleTracking = async (req, res) => {
    try {
        const tracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        if (!tracking) {
            return res.status(404).json({ success: false, message: "Keyword tracking not found" });
        } 

        tracking.active = !tracking.active;
        await tracking.save();

        res.status(200).json({ success: true, tracking });
    } catch (error) {
        console.error("Toggle tracking error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }

}