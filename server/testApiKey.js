// testApiKey.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.NVIDIA_API_KEY;
const BASE_URL = 'https://integrate.api.nvidia.com/v1'; // Confirm this with NVIDIA's documentation

async function testGenerateExplanation() {
  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: "mistralai/mixtral-8x7b-instruct-v0.1",
        messages: [
          { role: "user", content: "Write a limerick about the wonders of GPU computing." }
        ],
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
        // Remove 'stream' if not supported by NVIDIA's API
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("API Key is valid and request successful. Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error(`API Key validation failed: ${error.response.status} - "${error.response.data}"`);
    } else {
      console.error(`API Key validation failed: ${error.message}`);
    }
  }
}

testGenerateExplanation();