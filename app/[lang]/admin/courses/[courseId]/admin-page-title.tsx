"use client";

import { useAdminTitle } from "@/components/admin-sidebar";

// Registers the course name as the admin header title so the top bar shows the
// course name instead of the raw course id from the URL.
export const AdminPageTitle = ({ title }: { title: string }) => {
  useAdminTitle(title);
  return null;
};
