import { redirect, type ActionFunctionArgs } from "react-router";
import { userAuthStore } from "~/lib/authStore";

export async function loginAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");

  const res = await fetch("http://localhost:3000/api/v1/auth/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let msg = "";
    try {
      msg = (await res.json())?.error ?? "";
    } catch {}
    return { error: msg || "Invalid email or password." };
  }

  const { token } = await res.json();

  // Save token to local storage
  userAuthStore.getState().setAccessToken(token);

  return redirect("/", {
    headers: {
      "Set-Cookie": `auth=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`,
    },
  });
}

// TODO: make util to set JWT auth token before redirecting
// read token from query params, saves to local storage, redirects to dashboard

// handle if refresh token is invalidated, start by checking status of token
// AFTER validate if token is expired

// add rate limiting?
