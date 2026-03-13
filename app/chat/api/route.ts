import { Context7Agent } from "@upstash/context7-tools-ai-sdk";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { NextRequest, NextResponse } from "next/server";

const agent = new Context7Agent({
  model: openrouter("openrouter/free"),
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const { textStream } = await agent.stream({
      prompt: message,
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of textStream) {
              const bytes = new TextEncoder().encode(chunk);
              controller.enqueue(bytes);
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}