import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function askGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(prompt);
    const response = result.response.candidates[0].content.parts[0].text;

  return response;
}

export async function generateAiMessageForProducts(query, products){
    try{
       const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
       let productContext;
       if(!products.length){
            productContext = `No products found. Suggest alternatives.`;
       }
       else{
        productContext = products.map((prod, index) => `${index + 1}. ${prod.name} - ₹${prod.price || "N/A"}`).join('\n');
       }
       const prompt = `User search : "${query}"

        Matching store products:
        ${productContext}
            Write a short friendly product recommendation message:
            - Keep it casual
            - 2-3 lines max
            - Highlight best options, but DO NOT mention IDs
            - Encourage clicking products below
            `;
        const result = await model.generateContent(prompt);
        const aiMessage = await result.response.text();
        return aiMessage;    


    }catch(error){
        console.error("Gemini error → fallback text used:", error.message);
        return `Here are some matching products for "${query}". Click any product below to view details.`;
    }
}