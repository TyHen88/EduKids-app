import { auth } from "@clerk/nextjs/server";

// stored in .env file as a string separated by comma(,) and space( )
export const getAdminIds = (): string[] =>
  (process.env.CLERK_ADMIN_IDS ?? "")
    .split(", ")
    .map((id) => id.trim())
    .filter(Boolean);

export const getIsAdmin = async () => {
  const { userId } = await auth();
  const adminIds = getAdminIds();

  if (!userId) return false;

  return adminIds.indexOf(userId) !== -1;
};
