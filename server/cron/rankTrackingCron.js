import cron from "node-cron";
import KeywordTracking from "../models/KeywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js";

export function startRankTrackingCron() {
    cron.schedule("0 6 * * *", async () => {
        console.log("Starting daily rank tracking cron job...");
        try {
            const activeTrackings = await KeywordTracking.find({ active: true });
            for(const tracking of activeTrackings) {
                try {
                    tracking.status = "checking";
                    await tracking.save();

                    const result = await keywordTracking(tracking)
                    // Delay between checks to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 10000 + Math.random() * 5000));
                } catch (err) {
                    console.error("Error tracking keyword:", err.message);
                }
            }
        } catch (error) {
            console.error("Error in rank tracking cron job:", error.message);
        }
    })
    console.log("Rank tracking cron job scheduled to run daily at 6 AM.");
}