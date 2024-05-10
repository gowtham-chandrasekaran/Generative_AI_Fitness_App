import { prismadb } from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Get user threads from database
  const userThread = await prismadb.userThread.findUnique({
    where: { userId: user.id },
  });

  // if exists, return it
  if (userThread) {
    return NextResponse.json({ userThread, success: true }, { status: 200 });
  }
  //if not, create from openAI
  try {
    const openai = new OpenAI();
    const thread = await openai.beta.threads.create();
    // save it to database
    const newUserThread = await prismadb.userThread.create({
      data: {
        userId: user.id,
        threadId: thread.id,
      },
    });
    // return to it user
    return NextResponse.json(
      { userThread: newUserThread, success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error creating thread" },
      {
        status: 500,
      }
    );
  }
}
