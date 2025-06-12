import {genkit} from 'genkit';

// Example of configuring Genkit without any specific model providers initially.
// You would add plugins here if you were to integrate other services or local models.
export const ai = genkit({
  plugins: [],
  // model: 'some-other-model/if-needed', // No default model if we are not using any
});
