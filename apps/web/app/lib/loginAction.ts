import { redirect, type ActionFunctionArgs } from "react-router";
import { userAuthStore } from "~/lib/authStore";

export async function loginAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");

  let res: Response;
  try {
    // try to authenticate with backend API
    res = await fetch("http://localhost:3000/api/v1/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    console.error("Login request failed:", err);
    return {
      error: "Unable to reach authentication server. Is the backend running?",
    };
  }

  // Handle invalid authentication
  if (!res.ok) {
    let msg = "";
    try {
      msg = (await res.json())?.error ?? "";
    } catch {}
    return { error: msg || "Invalid email or password." };
  }

  // API returns JSON { token, refreshToken } (referenced from server _createUserSession)
  const data = await res.json();

  const refreshToken: string | null =
    data?.refreshToken ?? data?.refresh ?? null;

  // expiration
  const maxAge = 30 * 24 * 60 * 60;
  // Save token to local storage
  userAuthStore.getState().setAccessToken(data.token);

  return redirect("/", {
    headers: {
      "Set-Cookie": `auth=${data.token}; Path=/; HttpOnly; SameSite=Lax; Secure`,
    },
  });
}

// TODO: make util to set JWT auth token before redirecting
// read token from query params, saves to local storage, redirects to dashboard

// handle if refresh token is invalidated, start by checking status of token
// AFTER validate if token is expired

// add rate limiting?
