import ProfileContainer from "@/components/ProfileContainer";
import { prismadb } from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";
import React from "react";

export default async function ProfilePage() {
  const user = await currentUser();

  // user not authenticated
  if (!user) {
    throw new Error("User not authenticated.Please sign in.");
  }

  let challengePreferences = await prismadb.challengePreferences.findUnique({
    where: {
      userId: user.id,
    },
  });

  // if user is new, assign a preference
  if (!challengePreferences) {
    challengePreferences = await prismadb.challengePreferences.create({
      data: {
        userId: user.id,
        challengeId: "EASY",
      },
    });
  }

  return (
    <div className="max-w-screen-lg m-1 lg:mx-auto">
      <ProfileContainer challengePreferences={challengePreferences} />
    </div>
  );
}
