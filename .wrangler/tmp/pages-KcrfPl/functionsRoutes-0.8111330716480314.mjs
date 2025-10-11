import { onRequest as __api_events_js_onRequest } from "C:\\Projects\\my-website\\functions\\api\\events.js"
import { onRequestPost as __send_email_js_onRequestPost } from "C:\\Projects\\my-website\\functions\\send-email.js"

export const routes = [
    {
      routePath: "/api/events",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_events_js_onRequest],
    },
  {
      routePath: "/send-email",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__send_email_js_onRequestPost],
    },
  ]