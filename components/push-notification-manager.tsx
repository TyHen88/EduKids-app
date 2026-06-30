"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveSubscription } from "@/actions/notifications";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

// Convert a base64 string to Uint8Array for PushManager
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const PushNotificationManager = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      
      const hasSubscribed = !!subscription;
      setIsSubscribed(hasSubscribed);

      if (hasSubscribed) {
        // The browser already has a push subscription, but it may belong to a
        // previous user on this device. Re-link it to the CURRENT user so they
        // actually receive pushes (saveSubscription is idempotent).
        await saveSubscription(JSON.parse(JSON.stringify(subscription)));
      } else {
        // Show modal if not subscribed and hasn't dismissed it before
        const hasDismissed = localStorage.getItem("hidePushModal");
        if (!hasDismissed) setShowModal(true);
      }
    } catch (err) {
      console.error("Service Worker registration failed:", err);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    localStorage.setItem("hidePushModal", "true");
  };

  const subscribeToPush = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setIsLoading(false);
        handleDismiss();
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error("VAPID public key not found");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send to server
      const result = await saveSubscription(JSON.parse(JSON.stringify(subscription)));
      
      if (result.success) {
        setIsSubscribed(true);
        setShowModal(false);
        toast.success("Notifications enabled!");
      } else {
        toast.error(result.error || "Failed to save subscription");
      }
    } catch (err) {
      console.error("Failed to subscribe to push notifications", err);
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Dialog open={showModal} onOpenChange={(open) => {
      if (!open) handleDismiss();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto mb-4 p-4 w-20 h-20 flex items-center justify-center">
            <Image src="/edu-logo.png" alt="Mascot" width={48} height={48} />
          </div>
          <DialogTitle className="text-center text-2xl font-black text-slate-700">
            Never miss a request!
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 text-base">
            Enable notifications to instantly know when friends invite you to join their club!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col space-y-3 mt-6 sm:flex-col sm:space-y-3 sm:space-x-0">
          <Button 
            className="w-full h-14 text-lg rounded-2xl normal-case tracking-normal" 
            variant="secondary"
            onClick={subscribeToPush}
            disabled={isLoading}
          >
            <Bell className="w-6 h-6 mr-3" />
            {isLoading ? "Enabling..." : "Enable notifications"}
          </Button>
          <Button 
            className="w-full h-12 text-base rounded-2xl text-slate-400 normal-case tracking-normal mt-0" 
            variant="ghost"
            onClick={handleDismiss}
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
