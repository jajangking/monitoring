# Secure AI Integration Guide

This document explains how to properly integrate AI services like Grok and Groq with your application while maintaining security.

## Security Warning

**Never store API keys in client-side code.** The following implementation demonstrates the structure for a secure backend integration.

## Backend API Example for Groq

For a secure implementation with Groq, you need a backend service that handles the AI requests:

```javascript
// Example backend endpoint (Node.js/Express) for Groq using fetch
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;

  try {
    // Use the Groq API with your stored API key
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,  // Use Groq API key
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',  // or whatever model you prefer
        messages: [{ role: 'user', content: message }],
        max_tokens: 500
      })
    });

    const data = await response.json();
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Alternative approach using OpenAI SDK with Groq:
// First install: npm install openai
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'llama3-70b-8192', // or whatever model you prefer
    });

    res.json({ response: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});
```

## Backend API Example for Grok

For Grok integration (if you have access):

```javascript
// Example backend endpoint (Node.js/Express) for Grok
app.post('/api/ai/grok', async (req, res) => {
  const { message } = req.body;

  try {
    // Use the Grok API with your stored API key
    const response = await fetch('https://api.grok.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,  // Use Grok API key
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok', // or whatever the correct model name is
        messages: [{ role: 'user', content: message }],
        max_tokens: 500
      })
    });

    const data = await response.json();
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});
```

## Frontend Implementation

The frontend (your React Native app) would then call your secure backend:

```typescript
// In your aiService.ts
private async callBackendAI(userInput: string, context?: string[]): Promise<string> {
  try {
    const response = await fetch('https://your-backend-domain.com/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userInput,
        context: context || []
      })
    });

    const data = await response.json();
    return data.response;  // Return the AI-generated response
  } catch (error) {
    console.error('Backend AI API Error:', error);
    throw error;
  }
}
```

## Environment Configuration

Store the API key securely in your backend environment:

```
# Backend .env file
GROQ_API_KEY=your_actual_groq_api_key_here
# or for Grok
GROK_API_KEY=your_actual_grok_api_key_here
```

## Summary

- API keys should never be in client-side code
- Always use a backend service as a proxy for AI API calls
- The backend securely stores and uses the API key
- The frontend only communicates with your backend service
- This protects the API key from being exposed and potentially misused

This is the recommended and secure approach for implementing AI features with API keys.