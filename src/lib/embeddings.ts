import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDivHN1T564nPO-S_m6UYy4Q4l5ufQ0BZk');

export async function getEmbeddings(text: string) {
    try {
        // Get the embedding model
        const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
        
        // Create embeddings
        const result = await embeddingModel.embedContent(text.replace(/\n/g, " "));
        
        // Extract the embedding values
        return result.embedding.values;
    } catch (error) {
        console.log("error calling Gemini embeddings API", error);
        throw error;
    }
}