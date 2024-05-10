"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Message } from "openai/resources/beta/threads/messages.mjs";
import axios from "axios";
import { useAtom } from "jotai";
import { assistantAtom, userThreadAtom } from "@/atoms";
import toast from "react-hot-toast";
import { Run } from "openai/resources/beta/threads/runs/runs.mjs";

const POLLING_FREQUENCY_MS = 1000;

function ChatPage() {
  //atom state
  const [userThread] = useAtom(userThreadAtom);
  const [assistant] = useAtom(assistantAtom);

  // state
  const [fetching, setFetching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [pollingRun, setPollingRun] = useState(false);

  // console.log("userThread: ", userThread);
  // console.log("Messages: ", messages);

  const fetchMessages = useCallback(async () => {
    if (!userThread) return;

    // TODO: Fetch from api/messages/list
    setFetching(true);
    try {
      const response = await axios.post<{
        success: boolean;
        error?: string;
        messages?: Message[];
      }>("/api/message/list", { threadId: userThread.threadId });

      //validation
      if (!response.data.success || !response.data.messages) {
        console.error(response.data.error ?? "Unknown Error.");

        return;
      }

      let newMessages = response.data.messages;

      // console.log("newMessages: ", newMessages);

      // sort in descending order
      newMessages = newMessages
        .sort((a, b) => {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        })
        .filter(
          (message) =>
            message.content[0].type === "text" &&
            message.content[0].text.value.trim() !== ""
        );
      setMessages(newMessages);
    } catch (error) {
      console.error(error);
      setFetching(false);
      setMessages([]);
    } finally {
      setFetching(false);
    }
  }, [userThread]);

  useEffect(() => {
    const intervalId = setInterval(fetchMessages, POLLING_FREQUENCY_MS);
    // clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  const startRun = async (
    threadId: string,
    assistantId: string
  ): Promise<string> => {
    // api/run/create
    try {
      const {
        data: { success, run, error },
      } = await axios.post<{ success: boolean; error?: string; run?: Run }>(
        "/api/run/create",
        {
          threadId,
          assistantId,
        }
      );

      if (!success || !run) {
        console.error(error);
        toast.error("Failed to start run.");
        return "";
      }

      return run.id;
    } catch (error) {
      console.error(error);
      toast.error("Failed to start run.");
      return "";
    }
  };

  const pollRunStatus = async (threadId: string, runId: string) => {
    // api/run/retrieve
    setPollingRun(true);
    const intervalId = setInterval(async () => {
      try {
        const {
          data: { run, success, error },
        } = await axios.post<{
          success: boolean;
          error?: string;
          run?: Run;
        }>("/api/run/retrieve", {
          threadId,
          runId,
        });

        if (!success || !run) {
          console.error(error);
          toast.error("Failed to poll run status.");
          return;
        }
        if (run.status === "completed") {
          clearInterval(intervalId);
          setPollingRun(false);
          fetchMessages();
          return;
        } else if (run.status === "failed") {
          clearInterval(intervalId);
          setPollingRun(false);
          toast.error("Run Failed!");
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to poll run status.");
        clearInterval(intervalId);
      }
    }, POLLING_FREQUENCY_MS);
    // clean up
    return () => clearInterval(intervalId);
  };

  const sendMessage = async () => {
    //validation
    if (!userThread || sending || !assistant) {
      toast.error("Failed to send message. Invalid state.");
      return;
    }

    setSending(true);

    //send message to /api/message/create
    try {
      const {
        data: { message: newMessages },
      } = await axios.post<{
        success: boolean;
        message?: Message;
        error?: string;
      }>("/api/message/create", {
        message,
        threadId: userThread.threadId,
        fromUser: "true",
      });

      // update our messages with our new response
      if (!newMessages) {
        console.error("No message returned.");
        toast.error("Failed to send message. Please try again.");
        return;
      }
      setMessages((prev) => [...prev, newMessages]);
      setMessage("");
      toast.success("Message sent.");
      // start a run and then start polling
      const runId = await startRun(userThread.threadId, assistant.assistantId);
      if (!runId) {
        toast.error("Failed to start run.");
        return;
      }
      pollRunStatus(userThread.threadId, runId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send mesaage. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-screen h-[calc(100vh-64px)] flex flex-col bg-black text-white">
      {/* Messages */}

      <div className="flex-grow overflow-y-scroll p-8 space-y-2">
        {/* Fetching Messages */}
        {fetching && messages.length === 0 && (
          <div className="text-center font-bold">
            Please wait for the messages to be fetched...
          </div>
        )}
        {/* No Messages */}
        {messages.length === 0 && !fetching && (
          <div className="text-center font-bold">No messages</div>
        )}
        {/* List all Messages */}
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`px-4 py-2 mb-3 rounded-lg w-fit text-lg ${
                ["true", "True"].includes(
                  (message.metadata as { fromUser?: string }).fromUser ?? ""
                )
                  ? "bg-blue-600 ml-auto"
                  : "bg-gray-700"
              }`}
            >
              {message.content[0].type === "text"
                ? message.content[0].text.value
                    .split("\n")
                    .map((text, index) => <p key={index}>{text}</p>)
                : null}
            </div>
          );
        })}
      </div>

      {/* Input message */}
      <div className="mt-auto p-4 bg-gray-800">
        <div className="flex items-center bg-white p-2">
          <input
            type="text"
            className="flex-grow bg-transparent text-black focus:outline-none"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            disabled={
              !userThread?.threadId || !assistant || sending || !message.trim()
            }
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-full focus:outline-none disabled:bg-blue-700"
            onClick={sendMessage}
          >
            {sending ? "Sending..." : pollingRun ? "Polling..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
