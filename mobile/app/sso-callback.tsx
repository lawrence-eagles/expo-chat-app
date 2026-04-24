import React from "react";
import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

const Sso = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null; // for a better ux
  if (!isSignedIn) return <Redirect href={"/(auth)"} />;

  return <Redirect href={"/(tabs)"} />;
};

export default Sso;
