"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useDictionary } from "@/app/[lang]/lang-provider";

export const WELCOME_TOAST_KEY = "edukids-welcome-toast";

/**
 * Shows the "welcome back" toast on the page the user lands on AFTER a login.
 * Login does a full-page navigation (window.location.assign) which resets the
 * Toaster, so a toast fired on the login page would never be seen. Instead the
 * login flow sets a sessionStorage flag and this component (mounted in the root
 * layout) reads it once on the destination and clears it.
 */
export const WelcomeToast = () => {
  const dict = useDictionary();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // email/pin logins set a sessionStorage flag; Google OAuth (server redirect
    // via sso-callback) can't, so it appends ?welcome=1 instead.
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("welcome") === "1";
    const fromSession = !!sessionStorage.getItem(WELCOME_TOAST_KEY);

    if (fromQuery || fromSession) {
      sessionStorage.removeItem(WELCOME_TOAST_KEY);
      if (fromQuery) {
        params.delete("welcome");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (qs ? `?${qs}` : "")
        );
      }
      toast.success(dict["auth.loginSuccess"] || "Yay! Welcome back! 🎉");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
