import Analysis from "../models/Analysis.js";
import { scrapeUrl } from "../services/scrapperService.js";

// Analyze a URL
export const analyzeUrl = async (req, res) => {
    try {
        const {url} = req.body;
        if(!url) return res.status(400).json({
            success: false,
            message: "URL is required"
        });

        // Validate URL format
        let validUrl;
        try {
            validUrl = new URL(url.startsWith("http")? url : `https://${url}`);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid URL"
            });
        }

        // Create analysis record with pending status
        const analysis = await Analysis.create({
            userId: req.userId,
            url: validUrl.href,
            status: "processing"
        });

        // Send immediate response with analysis ID
        res.status(202).json({
            success: true,
            message: "Analysis started",
            analysisId: analysis._id
        });

        // Run the scraping and analysis in the background

        try {
            // Step 1: Scrape the URL with BrowserBase
            const scrapeResult = await scrapeUrl(validUrl.href)

            if(!scrapeResult.success){
                analysis.status = "failed";
                await analysis.save();
                return;
            }

            // Step 2: Analyze with Gemini AI

        } catch (bgerror) {
            console.error("Background analysis error:", bgerror.message);
            try {
                analysis.status = "failed";
                await analysis.save();
            } catch (saveError) {
                console.error("Failed to update analysis status:", saveError.message);
            }
        }

    } catch (error) {
        console.error("Analyze URL error:", error.message);
        if(!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }

}

// Get analysis by ID
export const getAnalysis = async (req, res) => {


}

// Get all analysis for user
export const getAnalysss = async (req, res) => {


}

// Delete analysis
export const deleteAnalysis = async (req, res) => {


}