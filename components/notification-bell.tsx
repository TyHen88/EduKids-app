"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Check, Trash2, MailOpen, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import * as Ably from "ably";

import { createAblyTokenRequest } from "@/actions/ably";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/notifications";

type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: Date;
};

type NotificationBellProps = {
  userId: string;
  initialNotifications: Notification[];
  initialUnreadCount: number;
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

export const NotificationBell = ({
  userId,
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Keep state in sync with props in case of server component re-render
  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  // Real-time: subscribe to this user's Ably channel and prepend new
  // notifications as they arrive (token auth — no API key in the browser).
  useEffect(() => {
    if (!userId) return;

    const client = new Ably.Realtime({
      authCallback: async (_params, callback) => {
        try {
          const tokenRequest = await createAblyTokenRequest();
          callback(null, tokenRequest as never);
        } catch (err) {
          callback(err as string, null);
        }
      },
    });

    const channel = client.channels.get(`notifications:${userId}`);
    const handler = (msg: Ably.Message) => {
      const incoming = msg.data as Notification;
      setNotifications((prev) =>
        prev.some((n) => n.id === incoming.id) ? prev : [incoming, ...prev]
      );
      setUnreadCount((prev) => prev + 1);
    };
    // `subscribe` triggers an implicit channel attach whose promise rejects
    // with "Connection closed" if the client is torn down mid-attach (e.g. a
    // React strict-mode remount, or a fast `userId` change). The teardown
    // below already closes the client, so swallow that rejection rather than
    // let it surface as an unhandledRejection.
    channel.subscribe("notification", handler).catch(() => {});

    return () => {
      channel.unsubscribe("notification", handler);
      client.close();
    };
  }, [userId]);

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.isRead
  );

  const handleMarkAsRead = async (id: number, url?: string | null) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    startTransition(() => {
      markNotificationAsRead(id);
    });

    if (url) {
      setIsOpen(false);
      router.push(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    startTransition(() => {
      markAllNotificationsAsRead();
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 shrink-0 rounded-full border-2 border-transparent bg-muted hover:bg-slate-200">
          <Bell className="h-5 w-5 text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">Notifications</SheetTitle>
              <SheetDescription>
                You have {unreadCount} unread message{unreadCount !== 1 && "s"}.
              </SheetDescription>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilter("all")}
                className="h-8 rounded-full text-xs"
              >
                All
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilter("unread")}
                className="h-8 rounded-full text-xs relative"
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
            
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No notifications yet</p>
              <p className="text-slate-400 text-sm mt-1">
                {filter === "unread" ? "You've read all your notifications!" : "When you get notifications, they'll show up here."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative flex items-start gap-4 p-4 transition-colors hover:bg-slate-50/50 cursor-pointer",
                    !notification.isRead && "bg-blue-50/40 hover:bg-blue-50/80"
                  )}
                  onClick={() => handleMarkAsRead(notification.id, notification.actionUrl)}
                >
                  <div className="mt-1 flex shrink-0 items-center justify-center">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      !notification.isRead ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                    )}>
                      {!notification.isRead ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <MailOpen className="h-4 w-4 opacity-70" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-1 gap-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm font-semibold truncate",
                        !notification.isRead ? "text-slate-900" : "text-slate-700"
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5 font-medium">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs line-clamp-2 leading-relaxed",
                      !notification.isRead ? "text-slate-700 font-medium" : "text-slate-500"
                    )}>
                      {notification.message}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
