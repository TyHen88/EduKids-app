"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { inviteFamilyAdult, removeFamilyAdult, acceptFamilyInvite, updateAdultPermissions } from "@/actions/family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, UserMinus, Mail, Plus, Settings, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { hasPermission, DEFAULT_MEMBER_PERMISSIONS, type PermissionAction } from "@/lib/family-permissions";

type AdultManagerProps = {
  isOwner: boolean;
  adults: {
    id: number;
    userId: string;
    status: string;
    permissions: any;
    user: {
      userName: string | null;
      userImageSrc: string | null;
    } | null;
  }[];
  ownerId: string;
  currentUserId: string;
  lang: string;
};

export const AdultManager = ({ isOwner, adults, ownerId, currentUserId, lang }: AdultManagerProps) => {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedAdult, setSelectedAdult] = useState<AdultManagerProps["adults"][0] | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  
  const autoAcceptFired = useRef(false);

  useEffect(() => {
    if (autoAcceptFired.current) return;
    const me = adults.find(a => a.userId === currentUserId);
    if (me && me.status === "pending") {
      autoAcceptFired.current = true;
      acceptFamilyInvite().catch(console.error);
    }
  }, [adults, currentUserId]);

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    startTransition(() => {
      inviteFamilyAdult(email, DEFAULT_MEMBER_PERMISSIONS, lang)
        .then(() => {
          toast.success("Invitation sent successfully!");
          setEmail("");
        })
        .catch((err) => toast.error(err.message));
    });
  };

  const onRemove = (adultId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    startTransition(() => {
      removeFamilyAdult(adultId, lang)
        .then(() => toast.success("Member removed!"))
        .catch((err) => toast.error(err.message));
    });
  };

  const openPermissions = (adult: AdultManagerProps["adults"][0]) => {
    setSelectedAdult(adult);
    setIsPermissionsModalOpen(true);
  };

  const handlePermissionToggle = (action: PermissionAction, checked: boolean) => {
    if (!selectedAdult) return;
    
    const currentPerms = selectedAdult.permissions || {};
    const newPermissions = {
      ...currentPerms,
      [action]: checked,
      // Clear legacy manage override when toggling specific permissions so granular toggles take effect
      manage: false,
    };
    
    setSelectedAdult({
      ...selectedAdult,
      permissions: newPermissions,
    });
    
    startTransition(() => {
      updateAdultPermissions(selectedAdult.userId, newPermissions, lang)
        .then(() => toast.success("Permissions updated!"))
        .catch((err) => toast.error(err.message));
    });
  };

  const isPermChecked = (action: PermissionAction) => {
    return hasPermission(selectedAdult?.permissions, action);
  };

  return (
    <div className="rounded-[32px] border-2 border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Family Members</h2>
          <p className="font-semibold text-slate-500">Manage adults who can view and manage this family.</p>
        </div>
        {isOwner && !showInviteForm && (
          <Button 
            onClick={() => setShowInviteForm(true)} 
            variant="secondary" 
            className="w-full sm:w-auto rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add new member
          </Button>
        )}
      </div>

      {isOwner && showInviteForm && (
        <form onSubmit={onInvite} className="mb-6 rounded-2xl border-2 border-slate-100 p-4 sm:p-6 bg-slate-50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Invite a new member</h3>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowInviteForm(false);
                setEmail("");
              }}
              className="text-slate-500"
            >
              Cancel
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 rounded-xl h-12 border-2 bg-white"
                disabled={isPending}
                required
              />
            </div>
            <Button type="submit" variant="primary" className="h-12 w-full sm:w-auto" disabled={isPending}>
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Invite"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {adults.map((adult) => (
          <div key={adult.id} className="flex items-center justify-between rounded-2xl border-2 border-slate-100 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                {adult.user?.userName?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-bold text-slate-800">{adult.user?.userName || "Unknown"}</p>
                <p className="text-sm font-semibold text-slate-500 capitalize">{adult.status}</p>
              </div>
            </div>
            {isOwner && adult.userId !== ownerId && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={isPending}
                    className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-full"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={() => openPermissions(adult)}
                    className="cursor-pointer font-bold text-slate-700"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Manage permissions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => onRemove(adult.userId)}
                    className="cursor-pointer font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {adult.userId === ownerId && (
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">OWNER</span>
            )}
          </div>
        ))}

        {adults.length === 0 && (
          <div className="text-center py-6 text-slate-500 font-semibold">
            No additional members in this family group.
          </div>
        )}
      </div>

      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manage Permissions</DialogTitle>
            <DialogDescription className="text-slate-500 font-semibold">
              Adjust what <span className="text-slate-800 font-bold">{selectedAdult?.user?.userName || "this member"}</span> can do in your family.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Create Children */}
            <div className="flex flex-row items-center justify-between rounded-xl border-2 border-slate-100 p-4">
              <div className="space-y-0.5 max-w-[280px]">
                <h4 className="font-bold text-slate-800">Create Children</h4>
                <p className="text-sm font-semibold text-slate-500">
                  Allow this member to add new child profiles to the family.
                </p>
              </div>
              <Switch
                checked={isPermChecked("createChild")}
                onCheckedChange={(checked) => handlePermissionToggle("createChild", checked)}
                disabled={isPending}
              />
            </div>

            {/* Edit Children */}
            <div className="flex flex-row items-center justify-between rounded-xl border-2 border-slate-100 p-4">
              <div className="space-y-0.5 max-w-[280px]">
                <h4 className="font-bold text-slate-800">Edit Children</h4>
                <p className="text-sm font-semibold text-slate-500">
                  Allow this member to edit or remove child profiles from the family.
                </p>
              </div>
              <Switch
                checked={isPermChecked("editChild")}
                onCheckedChange={(checked) => handlePermissionToggle("editChild", checked)}
                disabled={isPending}
              />
            </div>

            {/* Create Course */}
            <div className="flex flex-row items-center justify-between rounded-xl border-2 border-slate-100 p-4">
              <div className="space-y-0.5 max-w-[280px]">
                <h4 className="font-bold text-slate-800">Create Course</h4>
                <p className="text-sm font-semibold text-slate-500">
                  Allow this member to create and manage courses for the family.
                </p>
              </div>
              <Switch
                checked={isPermChecked("createCourse")}
                onCheckedChange={(checked) => handlePermissionToggle("createCourse", checked)}
                disabled={isPending}
              />
            </div>

            {/* Book Action */}
            <div className="flex flex-row items-center justify-between rounded-xl border-2 border-slate-100 p-4">
              <div className="space-y-0.5 max-w-[280px]">
                <h4 className="font-bold text-slate-800">Book Action</h4>
                <p className="text-sm font-semibold text-slate-500">
                  Allow this member to create and manage storybooks for the family.
                </p>
              </div>
              <Switch
                checked={isPermChecked("book")}
                onCheckedChange={(checked) => handlePermissionToggle("book", checked)}
                disabled={isPending}
              />
            </div>

            {/* Commons Event Action */}
            <div className="flex flex-row items-center justify-between rounded-xl border-2 border-slate-100 p-4">
              <div className="space-y-0.5 max-w-[280px]">
                <h4 className="font-bold text-slate-800">Commons Event Action</h4>
                <p className="text-sm font-semibold text-slate-500">
                  Allow this member to access and execute commons & event actions.
                </p>
              </div>
              <Switch
                checked={isPermChecked("commonsEvent")}
                onCheckedChange={(checked) => handlePermissionToggle("commonsEvent", checked)}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPermissionsModalOpen(false)} variant="secondary" className="w-full sm:w-auto">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
