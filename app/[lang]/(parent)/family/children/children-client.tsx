"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { UserPlus, Loader2, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { createChildAccount, removeChildAccount } from "@/actions/family";

type ChildrenClientProps = {
  initialChildren: any[];
  lang: string;
};

export const ChildrenClient = ({ initialChildren, lang }: ChildrenClientProps) => {
  const [children, setChildren] = useState(initialChildren);
  const [isPending, startTransition] = useTransition();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    pin: "",
  });

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length !== 4 || isNaN(Number(formData.pin))) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    startTransition(async () => {
      try {
        await createChildAccount(formData.name, formData.username, formData.pin, lang);
        toast.success("Child account created successfully!");
        setIsAdding(false);
        setFormData({ name: "", username: "", pin: "" });
        // The page will automatically reflect the new state because of revalidatePath,
        // but since we are passing initialData, we might need a router.refresh() if it doesn't update.
        // revalidatePath in the server action usually handles this.
        window.location.reload(); // Simple way to refresh data for now
      } catch (error: any) {
        toast.error(error.message || "Failed to create account. Username might be taken.");
      }
    });
  };

  const handleRemoveChild = async (childId: string) => {
    if (!confirm("Are you sure you want to completely remove this child account? This cannot be undone.")) return;

    startTransition(async () => {
      try {
        await removeChildAccount(childId, lang);
        toast.success("Child account removed.");
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || "Failed to remove child.");
      }
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Manage Children
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Create and manage profiles for your kids.
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="rounded-xl">
            <UserPlus className="mr-2 h-5 w-5" /> Add Child
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-800">Create New Profile</h2>
          <form onSubmit={handleAddChild} className="space-y-4 max-w-md">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Display Name</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Leo"
                className="h-12 rounded-xl border-2 bg-slate-50 px-4"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Unique Username</label>
              <Input
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. leo2026"
                className="h-12 rounded-xl border-2 bg-slate-50 px-4"
              />
            </div>
            <div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-bold text-slate-700">4-Digit Login PIN</Label>
                <div className="flex justify-start">
                  <InputOTP 
                    maxLength={4} 
                    value={formData.pin} 
                    onChange={(value) => setFormData({ ...formData, pin: value })}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-12 w-12 rounded-xl border-2 bg-slate-50 text-xl font-black" />
                      <InputOTPSlot index={1} className="h-12 w-12 rounded-xl border-2 bg-slate-50 text-xl font-black" />
                      <InputOTPSlot index={2} className="h-12 w-12 rounded-xl border-2 bg-slate-50 text-xl font-black" />
                      <InputOTPSlot index={3} className="h-12 w-12 rounded-xl border-2 bg-slate-50 text-xl font-black" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-12 rounded-xl"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => setIsAdding(false)}
                className="h-12 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
            <ShieldAlert className="h-6 w-6 shrink-0" />
            <p className="text-sm font-medium">
              Save the username and PIN! Your child will use them to log in on their device via the <strong>Kids Login</strong> portal.
            </p>
          </div>
        </div>
      )}

      {children.length === 0 && !isAdding ? (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          No children profiles created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {children.map((child) => (
            <div
              key={child.userId}
              className="flex flex-col justify-between rounded-[32px] border-2 border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50">
                  <Image
                    src={child.userImageSrc}
                    alt={child.userName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {child.userName}
                  </h3>
                  <div className="mt-1 inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                    ID: {child.userId.slice(-6)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t-2 border-slate-100 pt-4">
                <Button asChild variant="secondary" className="flex-1 rounded-xl">
                  <Link href={`/${lang}/family/children/${child.userId}`}>
                    View Progress
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => handleRemoveChild(child.userId)}
                  className="rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
