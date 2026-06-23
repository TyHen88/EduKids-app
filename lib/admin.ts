import { auth } from "@/lib/auth";

// stored in .env file as a string separated by comma(,) and space( ).
// Values are Supabase auth user UUIDs.
export const getAdminIds = (): string[] =>
  (process.env.ADMIN_IDS ?? "")
    .split(", ")
    .map((id) => id.trim())
    .filter(Boolean);

export const getIsAdmin = async () => {
  const { userId } = await auth();
  const adminIds = getAdminIds();

  if (!userId) return false;

  return adminIds.indexOf(userId) !== -1;
};
