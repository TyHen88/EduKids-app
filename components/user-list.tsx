"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import { UserPlus, UserMinus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendFriendRequest, removeFriend, loadMoreUsers } from "@/actions/connection";
import { useDictionary } from "@/app/[lang]/lang-provider";

type UserType = {
  userId: string;
  userName: string;
  userImageSrc: string;
  points: number;
};

type UserListProps = {
  initialUsers: UserType[];
  friendIds: string[];
  sentRequestIds: string[];
  searchQuery: string;
};

export const UserList = ({ initialUsers, friendIds: initialFriendIds, sentRequestIds: initialSentRequestIds, searchQuery }: UserListProps) => {
  const dict = useDictionary();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set(initialFriendIds));
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set(initialSentRequestIds));
  
  const [offset, setOffset] = useState(initialUsers.length);
  const [hasMore, setHasMore] = useState(initialUsers.length >= 10);
  const [isPending, startTransition] = useTransition();

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsers(initialUsers);
    setOffset(initialUsers.length);
    setHasMore(initialUsers.length >= 10);
    setFriendIds(new Set(initialFriendIds));
    setSentRequestIds(new Set(initialSentRequestIds));
  }, [initialUsers, searchQuery, initialFriendIds, initialSentRequestIds]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isPending, offset, searchQuery]);

  const loadMore = () => {
    startTransition(async () => {
      const newUsers = await loadMoreUsers(searchQuery, offset);
      if (newUsers.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
        setOffset((prev) => prev + newUsers.length);
        if (newUsers.length < 10) {
          setHasMore(false);
        }
      }
    });
  };

  const handleAction = async (userId: string, isFriend: boolean, isRequested: boolean) => {
    if (isFriend) {
      // Unfriend
      setFriendIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      await removeFriend(userId);
    } else if (isRequested) {
      // Cancel request
      setSentRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      await removeFriend(userId);
    } else {
      // Send request
      setSentRequestIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      await sendFriendRequest(userId);
    }
  };

  if (users.length === 0) {
    return (
      <p className="text-slate-500 text-center py-4">
        {dict["friends.noUsersFound"] || "No users found."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => {
        const isFriend = friendIds.has(user.userId);
        const isRequested = sentRequestIds.has(user.userId);
        
        return (
          <div
            key={user.userId}
            className="flex items-center justify-between rounded-2xl border-2 border-slate-100 p-4 transition-transform hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                <Image
                  src={user.userImageSrc}
                  alt={user.userName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-slate-800">{user.userName}</p>
                <p className="text-xs font-bold text-slate-400">
                  {user.points} XP
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleAction(user.userId, isFriend, isRequested)}
              variant={isFriend ? "dangerOutline" : isRequested ? "primaryOutline" : "secondary"}
              className="rounded-xl"
            >
              {isFriend ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />{" "}
                  {dict["friends.unfriend"] || "Unfriend"}
                </>
              ) : isRequested ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />{" "}
                  {dict["friends.requested"] || "Requested"}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />{" "}
                  {dict["friends.addFriend"] || "Add Friend"}
                </>
              )}
            </Button>
          </div>
        );
      })}
      
      {hasMore && (
        <div ref={loaderRef} className="py-4 text-center text-slate-400 text-sm">
          {dict["common.loadingMore"] || "Loading more..."}
        </div>
      )}
    </div>
  );
};

