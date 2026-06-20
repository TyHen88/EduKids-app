"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { GraduationCap, Users, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/app/[lang]/lang-provider";
import { createUserWithRole } from "@/actions/onboarding";

type Role = "learner" | "parent";

const OnboardingPage = () => {
  const locale = useLocale();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    if (!selectedRole) return;

    startTransition(async () => {
      await createUserWithRole(selectedRole, locale);

      if (selectedRole === "parent") {
        router.push(`/${locale}/family`);
      } else {
        router.push(`/${locale}/courses`);
      }
    });
  };

  const roles = [
    {
      id: "learner" as Role,
      title: "I'm a learner",
      description: "I want to explore courses, earn stardust, and go on learning adventures!",
      icon: GraduationCap,
      emoji: "🧑‍🎓",
      gradient: "from-indigo-500 to-purple-600",
      border: "border-indigo-300",
      activeBorder: "border-indigo-500 ring-4 ring-indigo-200",
      bg: "bg-indigo-50",
    },
    {
      id: "parent" as Role,
      title: "I'm a parent",
      description: "I want to create accounts for my children, assign courses, and monitor their progress.",
      icon: Users,
      emoji: "👨‍👩‍👧‍👦",
      gradient: "from-emerald-500 to-teal-600",
      border: "border-emerald-300",
      activeBorder: "border-emerald-500 ring-4 ring-emerald-200",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <Image
              src="/mascot.svg"
              alt="EduKids"
              width={80}
              height={80}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
            Welcome to EduKids! <Sparkles className="ml-1 inline h-7 w-7 text-yellow-500" />
          </h1>
          <p className="text-lg font-medium text-slate-500">
            Tell us who you are so we can customize your experience.
          </p>
        </div>

        {/* Role Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "relative flex flex-col items-center gap-4 rounded-[32px] border-[3px] p-8 text-center shadow-sm transition-all duration-200",
                  isSelected
                    ? `${role.activeBorder} ${role.bg} shadow-lg`
                    : `${role.border} bg-white hover:shadow-md`
                )}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md"
                  >
                    <div className={cn("h-5 w-5 rounded-full bg-gradient-to-br", role.gradient)} />
                  </motion.div>
                )}

                <div className="text-5xl">{role.emoji}</div>

                <div>
                  <h2 className="mb-1 text-xl font-black text-slate-800">
                    {role.title}
                  </h2>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">
                    {role.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isPending}
            className={cn(
              "h-14 w-full max-w-xs rounded-2xl border-b-4 text-lg font-black shadow-lg transition-all",
              selectedRole === "learner"
                ? "border-indigo-800 bg-indigo-600 hover:bg-indigo-700"
                : selectedRole === "parent"
                  ? "border-emerald-800 bg-emerald-600 hover:bg-emerald-700"
                  : "border-slate-300 bg-slate-200 text-slate-400"
            )}
          >
            {isPending ? (
              "Setting up..."
            ) : (
              <>
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
