import { OpenRouter } from "@openrouter/sdk";
import * as errors from "@openrouter/sdk/models/errors";
import { useAppStore } from "../store";

const apiKey = process.env.OPENROUTER_API_KEY || "";

export const openrouter = new OpenRouter({
  apiKey: apiKey
});

export interface StreamOptions {
  onChunk?: (content: string) => void;
  onUsage?: (usage: { reasoningTokens?: number; promptTokens?: number; completionTokens?: number; totalTokens?: number }) => void;
}

/**
 * Sends a message to OpenRouter and streams the response.
 * Adapts the provided snippet for general use in the app.
 */
export async function streamOpenRouter(
  prompt: string, 
  model: string = "google/gemma-4-31b-it:free", 
  options: StreamOptions = {}
) {
  let retries = 3;
  let delay = 1000;

  while (retries >= 0) {
    try {
      const stream = await openrouter.chat.send({
        chatRequest: {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          stream: true
        }
      });

      let fullResponse = "";
      
      // @ts-ignore - for await is supported in modern browsers/environments
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          if (options.onChunk) {
            options.onChunk(content);
          }
        }

        // Usage information comes in the final chunk
        if (chunk.usage && options.onUsage) {
          options.onUsage({
            reasoningTokens: (chunk.usage as any).reasoning_tokens || (chunk.usage as any).reasoningTokens,
            promptTokens: chunk.usage.promptTokens,
            completionTokens: chunk.usage.completionTokens,
            totalTokens: chunk.usage.totalTokens
          });
        }
      }

      return fullResponse;
    } catch (error: any) {
      const isRateLimit = error instanceof errors.TooManyRequestsResponseError || error.status === 429 || error.name === 'TooManyRequestsResponseError';
      
      if (isRateLimit && retries > 0) {
        console.warn(`OpenRouter rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
        continue;
      }
      
      const errorMsg = isRateLimit 
        ? "AI rate limit reached. Please try again later." 
        : `AI Error: ${error.message || "An unexpected error occurred"}`;
      
      useAppStore.getState().addToast(errorMsg, "error");
      console.error("OpenRouter Error:", error);
      throw error;
    }
  }
}
