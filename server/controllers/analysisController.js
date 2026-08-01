import Analysis from "../models/Analysis.js";
import { scrapeUrl } from "../services/scrapperService.js";
import { analyzeSeoData } from "../services/geminiService.js";
import dns from "dns/promises";
import net from "net";

const isPrivateIPv4 = (ip) => {
    const parts = ip.split(".").map(Number);
    if(parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) return false;
    const [a, b] = parts;
    if(a === 0 || a === 10 || a === 127) return true;
    if(a === 100 && b >= 64 && b <= 127) return true;
    if(a === 169 && b === 254) return true;
    if(a === 172 && b >= 16 && b <= 31) return true;
    if(a === 192 && (b === 0 || b === 168)) return true;
    if(a === 198 && (b === 18 || b === 19)) return true;
    if(a >= 224) return true;
    return false;
};

const isPrivateIPv6 = (ip) => {
    const lower = ip.toLowerCase();
    if(lower === "::" || lower === "::1" || lower.startsWith("::ffff:")) return true;
    const group = lower.split(":")[0];
    if(group.startsWith("fe") || group.startsWith("fc") || group.startsWith("fd")) return true;
    return false;
};

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
            if(!["http:", "https:"].includes(validUrl.protocol)) throw new Error("Invalid protocol");
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid URL"
            });
        }

        // Block SSRF targets (private/internal hostnames)
        try {
            const hostname = validUrl.hostname;
            const ipVersion = net.isIP(hostname);
            if(ipVersion === 4){
                if(isPrivateIPv4(hostname)){
                    return res.status(400).json({success: false, message: "URL is not accessible"});
                }
            } else if(ipVersion === 6){
                if(isPrivateIPv6(hostname)){
                    return res.status(400).json({success: false, message: "URL is not accessible"});
                }
            } else {
                const addresses = await dns.lookup(hostname, {all: true});
                if(addresses.some((addr) => net.isIPv4(addr.address) ? isPrivateIPv4(addr.address) : isPrivateIPv6(addr.address))){
                    return res.status(400).json({success: false, message: "URL is not accessible"});
                }
            }
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
            const aiResult = await analyzeSeoData(scrapeResult.data);

            if(!aiResult.success){
                analysis.status = "failed";
                await analysis.save();
                return;
            }

            // Step 3: Save Result
            analysis.overallScore = aiResult.data.overallScore || 0;
            analysis.categories = aiResult.data.categories || {};
            analysis.metaData = scrapeResult.data.metaData || {};
            analysis.headings = scrapeResult.data.headings || {};
            analysis.links = scrapeResult.data.links || {};
            analysis.images = scrapeResult.data.images || {};
            analysis.keywords = aiResult.data.keywords || [];
            analysis.issues = aiResult.data.issues || [];
            analysis.loadTime = scrapeResult.data.loadTime || 0;
            analysis.pageSize = scrapeResult.data.pageSize || 0;
            analysis.wordCount = scrapeResult.data.wordCount || 0;
            analysis.status = "completed";

            await analysis.save();

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
    try {
        const analysis = await Analysis.findOne({_id: req.params.id, userId: req.userId});

        if(!analysis) return res.status(404).json({
            success: false,
            message: "Analysis not found"
        });

        res.status(200).json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error("Get analysis error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }

}

// Get all analysis for user
export const getAnalyses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const analyses = await Analysis.find({userId: req.userId }).sort({createdAt: -1}).skip(skip).limit(limit).select("-issues -keywords");

        const total = await Analysis.countDocuments({userId: req.userId});

        res.status(200).json({
            success: true,
            analyses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get analyses error", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }

}

// Delete analysis
export const deleteAnalysis = async (req, res) => {
    try {
        await Analysis.findOneAndDelete({ _id: req.params.id, userId: req.userId });

        res.json({
            success: true,
            "message": "Analysis deleted"
        });
    } catch (error) {
        console.error("Delete analysis error", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }

}