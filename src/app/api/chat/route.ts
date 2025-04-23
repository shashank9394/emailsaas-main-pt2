import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Message  } from "ai";

import { NextResponse } from "next/server";
import { OramaManager } from "@/lib/orama";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
// import { getSubscriptionStatus } from "@/lib/stripe-actions";
// import { FREE_CREDITS_PER_DAY } from "@/app/constants";

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // const isSubscribed = await getSubscriptionStatus();
        // if (!isSubscribed) {
        //     const chatbotInteraction = await db.chatbotInteraction.findUnique({
        //         where: {
        //             day: new Date().toDateString(),
        //             userId
        //         }
        //     });

            // if (!chatbotInteraction) {
            //     await db.chatbotInteraction.create({
            //         data: {
            //             day: new Date().toDateString(),
            //             count: 1,
            //             userId
            //         }
            //     });
            // } else if (chatbotInteraction.count >= FREE_CREDITS_PER_DAY) {
            //     return NextResponse.json({ error: "Limit reached" }, { status: 429 });
            // }
        // }

        const { messages, accountId } = await req.json();
        const oramaManager = new OramaManager(accountId);
        await oramaManager.initialize();

        const lastMessage = messages[messages.length - 1];

        const context = await oramaManager.vectorSearch({ prompt: lastMessage.content });
        console.log(context.hits.length + ' hits found');

        const prompt = `
You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.
THE TIME NOW IS ${new Date().toLocaleString()}

START CONTEXT BLOCK
${context.hits.map((hit) => JSON.stringify(hit.document)).join('\n')}
END OF CONTEXT BLOCK

When responding, please keep in mind:
- Be helpful, clever, and articulate.
- Rely on the provided email context to inform your responses.
- If the context does not contain enough information to answer a question, politely say you don't have enough information.
- Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
- Do not invent or speculate about anything that is not directly supported by the email context.
- Keep your responses concise and relevant to the user's questions or the email being composed.
        `;

        // Get model and create stream
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContentStream({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `${prompt}\n\n${lastMessage.content}` }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 1,
                topP: 1,
                maxOutputTokens: 1024,
            },
            safetySettings: [
            ]
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    controller.enqueue(encoder.encode(text));
                }
                controller.close();

                // On completion
                // const today = new Date().toDateString();
                // await db.chatbotInteraction.update({
                //     where: {
                //         userId,
                //         day: today
                //     },
                //     data: {
                //         count: {
                //             increment: 1
                //         }
                //     }
                // });
            }
        });

        return null ;

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "error" }, { status: 500 });
    }
}
