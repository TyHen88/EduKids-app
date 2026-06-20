import { clerkClient } from "@clerk/nextjs/server";

export const run = async () => {
  try {
    const client = await clerkClient();
    const childUser = await client.users.createUser({
      firstName: "TestChild",
      username: "testchild123",
      emailAddress: ["testchild123@dummy.edukids.com"],
      password: "1234",
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });
    console.log("Success:", childUser.id);
  } catch (error: any) {
    console.error("Error:");
    console.log(JSON.stringify(error, null, 2));
  }
};

run();
