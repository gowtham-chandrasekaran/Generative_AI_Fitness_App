"use client";

import NavBar from "@/components/NavBar";
import { useEffect } from "react";
import axios from "axios";
import { Assistant, UserThread } from "@prisma/client";
import { useAtom } from "jotai";
import { assistantAtom, userThreadAtom } from "@/atoms";
import toast, { Toaster } from "react-hot-toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // If the user doesn't have a threadId, we make one.
  // If the user has a threadId, we fetch messages.
  // const [userThread, setUserThread] = useState<UserThread | null>(null);

  // accessing global state through atom
  // REMOVED userThread in github og code
  const [userThread, setUserThread] = useAtom(userThreadAtom);
  const [assistant, setAssistant] = useAtom(assistantAtom);

  useEffect(() => {
    if (assistant) return;
    async function getAssistant() {
      try {
        const response = await axios.get<{
          success: boolean;
          message?: string;
          assistant: Assistant;
        }>("/api/assistant");

        if (!response.data.success || !response.data.assistant) {
          console.error(response.data.message ?? "Unknown error.");
          toast.error("Failed to fetch assistant AI.");
          setAssistant(null);
          return;
        }
        setAssistant(response.data.assistant);
      } catch (error) {
        console.error(error);
        setAssistant(null);
      }
    }
    getAssistant();
  }, [assistant, setAssistant]);

  useEffect(() => {
    async function getUserThread() {
      try {
        const response = await axios.get<{
          success: boolean;
          message?: string;
          userThread: UserThread;
        }>("/api/user-thread");
        if (!response.data.success || !response.data.userThread) {
          console.error(response.data.message ?? "Unknown error.");
          setUserThread(null);
          return;
        }
        setUserThread(response.data.userThread);
      } catch (error) {
        console.error(error);
        setUserThread(null);
      }
    }
    getUserThread();
  }, [setUserThread]);

  return (
    <div className="flex flex-col w-full h-full">
      <NavBar />
      {children}
      <Toaster />
    </div>
  );
}
