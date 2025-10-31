import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("/", "layouts/AppLayout.tsx", [
    index("routes/home.tsx"),
    route("session", "routes/session.tsx"),
    route("upload", "routes/upload.tsx"),
    route("download", "routes/download.tsx"),
  ]),

  route("/", "layouts/AuthLayout.tsx", [
    route("login", "routes/login.tsx"),
    route("signup", "routes/signup.tsx"),
    route("join-org-app", "routes/joinorgapp.tsx"),
    route("create-org-app", "routes/createorgapp.tsx"),
    route("verify-email", "routes/verify-email.tsx"),
    route("email-verified", "routes/email-verified.tsx"),
    route("join-org", "routes/joinorg.tsx"),
    route("create-org", "routes/createorg.tsx"),
    route("add-member", "routes/add-member.tsx"),
    route("terms", "routes/terms.tsx"),
    route("confirmation", "routes/confirmation.tsx"),
    route("forgot-password", "routes/forgot-password.tsx"),
    route("reset-password", "routes/reset-password.tsx"),
    route("reset-confirmation", "routes/reset-confirmation.tsx"),
    route("link-expired", "routes/link-expired.tsx"),
    route("components", "routes/components.tsx"),
  ]),
] satisfies RouteConfig;
