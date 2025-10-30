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
    route("join org applications", "routes/joinorgapp.tsx"),
    route("components", "routes/components.tsx"),
  ]),
] satisfies RouteConfig;
