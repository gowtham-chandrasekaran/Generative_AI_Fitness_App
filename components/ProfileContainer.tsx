"use client";

import { ChallengePreferences } from "@prisma/client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import DifficultyCard from "./DifficultyCard";
import axios from "axios";
import toast from "react-hot-toast";

const difficulties = [
  {
    id: "EASY",
    level: "Easy",
    description: "Receive 3 challenges per day (7:30AM, 12PM, & 5:30PM EST).",
  },
  {
    id: "MEDIUM",
    level: "Medium",
    description: "Receive 4 challenges per day (7AM, 12PM, 5PM, & 8PM EST).",
  },
  {
    id: "HARD",
    level: "Hard",
    description:
      "Receive 5 challenges per day (6AM, 9AM, 12PM, 5PM, & 8PM EST).",
  },
];

type Difficulties = "EASY" | "MEDIUM" | "HARD";

interface ProfileContainerProps {
  challengePreferences: ChallengePreferences;
}

function ProfileContainer({ challengePreferences }: ProfileContainerProps) {
  const [saving, setSaving] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(
    challengePreferences.sendNotifications
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    challengePreferences.challengeId
  );

  const handleToggleNotifications = () => {
    setSendNotifications((prev) => !prev);
  };
  const handleSelectDifficulty = (difficultyId: Difficulties) => {
    setSelectedDifficulty(difficultyId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.post<{
        success: boolean;
        data?: ChallengePreferences;
        message?: string;
      }>("/api/challenge-preferences", {
        id: challengePreferences.id,
        challengeId: selectedDifficulty,
        sendNotifications,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message ?? "Something went wrong");
        toast.error(response.data.message ?? "Something went wrong.");
      }

      toast.success("Preferences saved!");
    } catch (error) {
      console.error(error);
      toast.error("Something went wring. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between items-center mb-4">
        {/* TITLE */}
        <h1 className="font-bold text-2xl">Challenge Level</h1>
        {/* Button */}
        <Button onClick={handleSave}>{saving ? "Saving..." : "Save"}</Button>
      </div>
      <div className="flex flex-row items-center justify-between mb-4 p-4 shadow rounded-lg">
        {/* Push notification toggle */}
        <div>
          <h3 className="font-medium text-lg text-gray-900">
            Push Notifcations
          </h3>
          <p>Receive push notifications when new challenges are available.</p>
        </div>
        <Switch
          checked={sendNotifications}
          onCheckedChange={handleToggleNotifications}
        />
      </div>
      <div className="grid grid-col-1 md:grid-cols-3 gap-4">
        {/* Map through difficulties (Grid) */}
        {difficulties.map((difficulty) => (
          <DifficultyCard
            key={difficulty.id}
            level={difficulty.level}
            description={difficulty.description}
            selected={difficulty.id === selectedDifficulty}
            onSelect={() =>
              handleSelectDifficulty(difficulty.id as Difficulties)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default ProfileContainer;
