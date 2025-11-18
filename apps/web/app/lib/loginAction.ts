import { redirect, type ActionFunctionArgs } from "react-router";
import { userAuthStore } from "~/lib/auth";
import { API_BASE_URL } from "~/config/constants";

export async function loginAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const email = fd.get("email") ?? "";
  const password = fd.get("password") ?? "";

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}/auth/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    console.error("Error contacting API:", err);
    return { error: "Unable to contact API" };
  }

  if (!res.ok) {
    let msg = "";
    try {
      msg = (await res.json())?.error ?? "";
    } catch {}
    return { error: msg || "Invalid email or password." };
  }

  // Success: API returns JSON { token, refreshToken } (referenced from server _createUserSession)
  const data = await res.json();

  const refreshToken: string | null =
    data?.refreshToken ?? data?.refresh ?? null;

  // Save token to local storage
  userAuthStore.getState().setAccessToken(data.token);
  userAuthStore.getState().setRefreshToken(refreshToken);

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
