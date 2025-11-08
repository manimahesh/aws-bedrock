// server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime'); 

dotenv.config();

const app = express();
const port = 3000;

// AWS Region must be set where Bedrock is enabled (e.g., us-east-1)
const AWS_REGION = process.env.AWS_REGION || 'us-west-2'; 
const client = new BedrockRuntimeClient({ region: AWS_REGION });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function generateItinerary(city, duration) {
    const messages = [
        { role: "system", content: "You are a helpful and creative travel planning assistant. Your output must be in Markdown format." },
        { role: "user", content: `Create a detailed, day-by-day itinerary for a ${duration}-day trip to ${city}.` },
    ];

    const payload = {
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048 // Max tokens is a common parameter for many models
    };

    const input = {
        modelId: "openai.gpt-oss-120b-1:0", // Replace with your actual Bedrock OpenAI model ID
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
    };

    try {
        const command = new InvokeModelCommand(input);
        const response = await client.send(command);

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // Response structure may vary, but typically follows OpenAI standards for chat models
        return responseBody.choices[0].message.content; 

    } catch (error) {
        console.error("Bedrock API call failed:", error);
        throw new Error(`Bedrock invocation error: ${error.message}`);
    }
}

app.post('/api/itinerary', async (req, res) => {
    const { city, duration } = req.body;
    if (!city || !duration) {
        return res.status(400).json({ error: 'City and duration are required.' });
    }

    try {
        const itinerary = await generateItinerary(city, duration);
        res.json({ itinerary: itinerary });
    } catch (error) {
        console.error('AI Agent error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate itinerary. Check server logs.'
        });
    }
});

app.listen(port, () => {
    console.log(`AI Travel Agent listening at http://localhost:${port}`);
});