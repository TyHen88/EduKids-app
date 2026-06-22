import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Star, Users, UserPlus, UserMinus, Check, X } from "lucide-react";

import {
  getFollowing,
  getPendingRequests,
  getSentRequests,
  getTopFriends,
  searchUsers,
  getUserProgress,
} from "@/db/queries";
import { acceptFriendRequest, removeFriend } from "@/actions/connection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserList } from "@/components/user-list";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/app/[lang]/dictionaries";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const FriendsPage = async ({ params, searchParams }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const { q } = await searchParams;
  const searchQuery = typeof q === "string" ? q : "";

  const [
    userProgress, 
    friends, 
    pendingRequests,
    sentRequests,
    topFriends, 
    searchResults
  ] = await Promise.all([
    getUserProgress(),
    getFollowing(), // this now only returns accepted friends
    getPendingRequests(),
    getSentRequests(),
    getTopFriends(),
    searchUsers(searchQuery),
  ]);

  if (!userProgress) {
    redirect(`/${lang}`);
  }

  const friendIds = new Set(friends.map((f) => f.userId));
  const sentRequestIds = new Set(sentRequests.map((f) => f.userId));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-indigo-100 p-4 text-indigo-600">
          <Users className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">
            {dict["friends.title"] || "Friends"}
          </h1>
          <p className="text-slate-500 font-medium">
            {dict["friends.subtitle"] ||
              "Find friends, accept requests, and compete on the leaderboard!"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {/* Search Section */}
          <section className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-slate-800 flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-500" />{" "}
              {dict["friends.findFriends"] || "Find Friends"}
            </h2>
            <form className="flex gap-2 mb-6" method="GET">
              <Input
                name="q"
                defaultValue={searchQuery}
                placeholder={dict["friends.searchByName"] || "Search by name..."}
                className="rounded-xl border-2 border-slate-200 bg-slate-50 h-12 px-4"
              />
              <Button type="submit" variant="secondary" className="h-12 rounded-xl">
                {dict["friends.search"] || "Search"}
              </Button>
            </form>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-500 uppercase tracking-wider text-xs">
                {searchQuery
                  ? dict["friends.searchResults"] || "Search Results"
                  : dict["friends.registeredExplorers"] ||
                    "Registered Explorers"}
              </h3>
              <UserList
                initialUsers={searchResults}
                friendIds={Array.from(friendIds)}
                sentRequestIds={Array.from(sentRequestIds)}
                searchQuery={searchQuery}
              />
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Lists */}
        <div className="space-y-6">
          {/* Friend Requests */}
          <section className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />{" "}
              {dict["friends.friendRequests"] || "Friend Requests"}
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-slate-500">
                {dict["friends.noPendingRequests"] || "No pending requests."}
              </p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((user) => (
                  <div key={user.userId} className="flex flex-col gap-3 rounded-2xl border-2 border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100 border-2 border-slate-200 shrink-0">
                        <Image src={user.userImageSrc} alt={user.userName} fill className="object-cover" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 truncate flex-1">{user.userName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form
                        className="flex-1"
                        action={async () => {
                          "use server";
                          await acceptFriendRequest(user.userId);
                        }}
                      >
                        <Button size="sm" variant="secondary" className="w-full h-8 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-600 hover:bg-indigo-200">
                          <Check className="h-4 w-4 mr-1" />{" "}
                          {dict["friends.accept"] || "Accept"}
                        </Button>
                      </form>
                      <form
                        className="flex-1"
                        action={async () => {
                          "use server";
                          await removeFriend(user.userId);
                        }}
                      >
                        <Button size="sm" variant="ghost" className="w-full h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100">
                          <X className="h-4 w-4 mr-1" />{" "}
                          {dict["friends.decline"] || "Decline"}
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Friends List */}
          <section className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />{" "}
              {dict["friends.title"] || "Friends"} ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <p className="text-sm text-slate-500">
                {dict["friends.noFriendsYet"] || "You have no friends yet."}
              </p>
            ) : (
              <div className="space-y-3">
                {friends.map((user) => (
                  <div key={user.userId} className="flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-100 border-2 border-slate-200">
                      <Image src={user.userImageSrc} alt={user.userName} fill className="object-cover" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 truncate flex-1">{user.userName}</p>
                    <form
                      action={async () => {
                        "use server";
                        await removeFriend(user.userId);
                      }}
                    >
                      <Button size="sm" variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 h-7 rounded-lg text-xs font-bold">
                        {dict["friends.unfriend"] || "Unfriend"}
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />{" "}
              {dict["friends.leaderboard"] || "Friends Leaderboard"}
            </h3>
            {topFriends.length <= 1 ? (
              <div className="text-center py-4">
                <Image
                  src="/mascot.svg"
                  alt={dict["friends.mascot"] || "Mascot"}
                  width={60}
                  height={60}
                  className="mx-auto mb-2 opacity-50 grayscale"
                />
                <p className="text-slate-500 font-bold mb-1 text-sm">
                  {dict["friends.noFriendsYetExcl"] || "No friends yet!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topFriends.map((user, i) => {
                  const isYou = user.userId === userProgress.userId;
                  return (
                    <div
                      key={user.userId}
                      className={cn(
                        "relative flex items-center justify-between rounded-2xl border-2 p-3 transition-transform hover:scale-[1.01]",
                        isYou
                          ? "border-indigo-200 bg-indigo-50"
                          : "border-slate-100 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full font-black text-xs",
                            i === 0
                              ? "bg-yellow-400 text-yellow-900"
                              : i === 1
                              ? "bg-slate-300 text-slate-800"
                              : i === 2
                              ? "bg-amber-600 text-amber-100"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {i + 1}
                        </div>
                        <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                          <Image
                            src={user.userImageSrc}
                            alt={user.userName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="font-bold text-slate-800 text-sm truncate max-w-[80px]">
                          {isYou ? dict["friends.you"] || "You" : user.userName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-black text-indigo-600 text-xs shrink-0">
                        {user.points} <Star className="h-3 w-3 fill-current" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
