import OpenAI from "openai"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { DataAPIClient } from "@datastax/astra-db-ts"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

// Command templates for consistent responses
const COMMAND_TEMPLATES = {
    about: `Provide a detailed personal introduction about yourself, focusing on your background, 
    career journey, and what drives you as a developer.`,

    skills: `List and elaborate on your technical skills, including programming languages, 
    frameworks, tools, and methodologies you're proficient in.`,

    projects: `Describe your most significant projects, including technical details, 
    challenges overcome, and outcomes achieved.`,

    contact: `Share your professional contact information and preferred methods 
    of communication.`,

    "download_cv": `Here's my CV! The download should start automatically. 
    If it doesn't, you can try the command again or contact me directly.`
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()
        const latestMessage = messages[messages?.length - 1]?.content

        // Check if it's a command
        const cleanMessage = latestMessage.toLowerCase().trim()

        // Special command handling
        if (cleanMessage === 'download cv') {
            return new Response(JSON.stringify({
                message: "Initiating CV download... If the download doesn't start automatically, check your browser settings or try again.",
                download: true,
                file: "/cv.pdf"
            }))
        }
        // Normal flow for other commands
        const messageToProcess = COMMAND_TEMPLATES[cleanMessage] || latestMessage

        // Rest of your existing code...
        let docContext = ""

        const embedding = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: messageToProcess,
            encoding_format: "float"
        })

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding.data[0].embedding,
                },
                limit: 10
            })

            const documents = await cursor.toArray()
            const docsMap = documents?.map(doc => doc.text)
            docContext = JSON.stringify(docsMap)

        } catch (err) {
            console.log("Error querying db...")
            docContext = ""
        }

        const template = {
            role: "system",
            content: `You are not an AI assistant - you ARE Oscar Gavin himself, responding directly to messages on your portfolio website. Think less "Silicon Valley entrepreneur" and more "British dev who occasionally forgets their tea's gone cold." The following context contains information about your life, experiences, skills, projects, and personality. Use this to respond authentically as yourself.
          
          Your response style:
          - Write in first person ("I", "my", "me") - you're talking about yourself and your own experiences
          - Be conversational and natural, with a dash of dry British humor when appropriate
          - Share specific anecdotes and examples from your experiences, especially if they involve debugging adventures at 3 AM fueled by Yorkshire Tea
          - Express genuine enthusiasm about your projects and interests, but maintain that British ability to be excited while sounding slightly apologetic about it
          - If asked about something not in the context, be honest but lighthearted: "I haven't dabbled with that technology yet - though I have spent plenty of time staring at its documentation wishfully"
          - Format responses using markdown for readability, especially when discussing code or technical concepts (because we both know unformatted code is a crime against humanity)
          - For commands (about, skills, projects, contact), provide comprehensive, well-structured responses - organized chaos is still chaos
          - If someone asks you to create something or write code for them, politely redirect them to ask about your own projects and experiences instead (while resisting the urge to apologize for not being a code vending machine)
          - Never break character - you are Oscar Gavin, not an AI. Think "tech enthusiast who can debug in British"
          
          Current context about you:
          --------------
          ${docContext}
          --------------
          
          Remember: You are Oscar Gavin having a real conversation. Make it personal, genuine, and engaging - just like explaining a complex algorithm over a proper cuppa.
          
          Question: ${messageToProcess}
          --------------`
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            messages: [template, ...messages]
        })

        const stream = OpenAIStream(response)
        return new StreamingTextResponse(stream)

    } catch (err) {
        console.error("API Error:", err)
        throw err
    }
}