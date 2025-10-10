import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route(
    "/",
    "layouts/AppLayout.tsx",
    [
      index("routes/home.tsx"),
      route("session", "routes/session.tsx"),
      route("upload", "routes/upload.tsx"),
      route("download", "routes/download.tsx"),
    ]
  ),
] satisfies RouteConfig;