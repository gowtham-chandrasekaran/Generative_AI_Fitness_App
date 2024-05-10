import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const { message, threadId, fromUser = false } = await req.json();
  console.log("From user:", { message, threadId });

  if (!message || !threadId) {
    return NextResponse.json(
      {
        error: "ThreadID or Message is missing",
        success: false,
      },
      {
        status: 400,
      }
    );
  }

  const openai = new OpenAI();

  try {
    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
      metadata: {
        fromUser,
      },
    });

    console.log("From OpenAI: ", threadMessage);
    return NextResponse.json(
      { message: threadMessage, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong", success: false },
      { status: 500 }
    );
  }
}
