import KeywordTracking from "../models/KeywordTracking.js";

// Add a keyword to track 
export const addKeyword = async (req,res) => {
    try {
        const {keyword, url} = req.body

        if(!keyword || !url) return res.status(400).json({
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
            stauts: "checking"
        });


        res.status(201).json({
            success: true,
            message: "Keyword added for tracking successfully",
            data: newKeywordTracking
        });


    } catch (error) {
        
    }

}

// Get all tracked keywords for user
export const getKeywords = async (req, res) => {


}

// Get single keyword with full history
export const getKeyword = async (req, res) => {


}

// Manually refresh a keyword ranking
export const refreshKeyword = async (req, res) => {


}

// Delete keyword tracking
export const deleteKeyword = async (req, res) => {


}

// Toggle tracking active/inactive 
export const toggleTracking = async (req, res) => {


}