# Environment Variables Setup Guide

This application requires several environment variables to work properly. Follow these steps to set them up:

## Getting Required API Keys

### 1. Groq API Key
1. Go to https://console.groq.com/
2. Sign up for an account (if you don't have one)
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the API key (it will look like `gsk_your_key_here`)

### 2. Supabase URL and Anon Key
1. Go to https://supabase.com/
2. Sign up for an account (if you don't have one)
3. Create a new project
4. In your project dashboard, go to "Settings" > "API"
5. Copy the "Project URL" and "Anonymous API Key"

## Setting Up Environment Variables

Create a `.env` file in the root of your project (same directory as `package.json`) with the following content:

```
# API Keys
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace the placeholder values with your actual API keys:

- `your_groq_api_key_here` - Your Groq API key from step 1
- `your_supabase_url_here` - Your Supabase Project URL from step 2
- `your_supabase_anon_key_here` - Your Supabase Anonymous API Key from step 2

## Starting the Application

Run the application directly:
```bash
npx expo start
```

Note: This approach makes direct API calls from the client, which is less secure than using a server proxy but simpler for development purposes.

## Troubleshooting

If you still see 400 errors:
1. Verify your API key is correct and has not expired
2. Check that your account has sufficient quota/credits
3. Ensure your network connection allows access to the Groq API
4. If using a corporate network, check if there are any proxy/firewall restrictions
5. Check if the model name is still supported - model names may change over time, visit https://console.groq.com/docs/models to see currently supported models