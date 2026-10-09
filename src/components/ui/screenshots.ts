import momTribute from "@/images/mom-tribute.png";
import paymentsPortal from "@/images/payments-portal-app.png";
import supportTicket from "@/images/support-ticket-management-system.png";
import type { StaticImageData } from "next/image";
import type { ScreenshotKey } from "@/content/types";

/** Content refers to screenshots by key; this maps keys to image imports. */
export const screenshots: Record<ScreenshotKey, StaticImageData> = {
  "support-ticket": supportTicket,
  "payments-portal": paymentsPortal,
  "mom-tribute": momTribute,
};
