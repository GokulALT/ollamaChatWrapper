'use server';
/**
 * @fileoverview This file initializes the Genkit AI framework and configures the plugins.
 * It is the entry point for all AI-related functionality in the application.
 *
 * It currently configures the Google AI (Gemini) plugin. The `ai` object exported
 * from this file is a singleton that should be used to define flows, prompts, and tools.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit and configure plugins.
export const ai = genkit({
  plugins: [
    googleAI({
      // The API key is read from the GEMINI_API_KEY environment variable.
      // You can get one from Google AI Studio: https://aistudio.google.com/app/apikey
    }),
  ],
  // Log developer-friendly errors
  dev: true,
  // Recommended for production applications.
  // logToConsole: true,
});
