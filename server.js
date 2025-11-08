// server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime'); 

// Load environment variables (dotenv is primarily for local testing credentials)
dotenv.config();

const app = express();
const port = 3000;

// Initialize the Bedrock Runtime Client
// The client will automatically discover credentials in the EKS environment
// (via the IAM Role/IRSA) and use the specified region.
const AWS_REGION = process.env.AWS_REGION || 'us-west-2'; // Use the region where Bedrock is enabled
const client = new BedrockRuntimeClient({ region: AWS_REGION });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Calls the AWS Bedrock API to generate a detailed travel itinerary using an OpenAI model.
 * @param {string} city - The destination city.
 * @param {number} duration - The duration of stay in days.
 * @returns {Promise<string>} The generated itinerary as a markdown string.
 */
async function generateItinerary(city, duration) {
    // 1. Define the system and user messages
    const messages = [
        { role: "system", content: "You are a helpful and creative travel planning assistant. Your output must be in Markdown format." },
        { role: "user", content: `You are a world-class travel agent. Create a detailed, day-by-day itinerary for a ${duration}-day trip to ${city}. The itinerary must be formatted using **Markdown** for readability. Include suggested activities for morning, afternoon, and evening for each day.` },
    ];

    // 2. Define the payload structure required by the OpenAI model on Bedrock
    const payload = {
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
    };

    // 3. Define the Bedrock InvokeModel parameters
    const input = {
        modelId: "openai.gpt-oss-120b-1:0", // Example model. Use the specific OpenAI model ID you have enabled.
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
    };

    try {
        const command = new InvokeModelCommand(input);
        const response = await client.send(command);

        // 4. Decode the response body
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // The response structure from Bedrock's OpenAI model often mirrors the native OpenAI API format
        return responseBody.choices[0].message.content; 

    } catch (error) {
        console.error("Bedrock API call failed:", error);
        throw new Error(`Bedrock invocation error: ${error.message}`);
    }
}

// API endpoint is the same
app.post('/api/itinerary', async (req, res) => {
    const { city, duration } = req.body;
    // ... (omitted validation logic) ...
    
    try {
        const itinerary = await generateItinerary(city, duration);
        res.json({ itinerary: itinerary });
    } catch (error) {
        console.error('AI Agent error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate itinerary.',
            detail: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`AI Travel Agent listening at http://localhost:${port}`);
});