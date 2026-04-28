import {
  Show,
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import PageLoader from "./components/PageLoader";
import useUserSync from "./hooks/useUserSync";

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  useUserSync();

  if (!isLoaded) return <PageLoader />;

  return (
    <Routes>
      <Route
        path="/"
        element={!isSignedIn ? <HomePage /> : <Navigate to={"/chat"} />}
      />
      <Route
        path="/chat"
        element={isSignedIn ? <ChatPage /> : <Navigate to={"/"} />}
      />
    </Routes>
  );
}

export default App;
