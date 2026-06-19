import type { ReactNode } from "react";
import { Rocket } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) => {
  return (
    <div className="w-full max-w-md px-4 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2 text-2xl font-extrabold text-indigo-600">
          <div className="rounded-xl bg-indigo-600 p-2 text-white">
            <Rocket className="h-6 w-6" />
          </div>
          EduKids
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          {title}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
      </div>

      <div className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>

      {footer && (
        <div className="mt-6 text-center text-sm font-medium text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export const authInputClass =
  "rounded-2xl border-2 border-slate-200 focus-visible:ring-indigo-500";
