import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import Header from "./header";

const Page = async () => {
  const preloadedUserQuery = await preloadAuthQuery(api.auth.getCurrentUser);

  return (
    <div>
      <Header preloadedUserQuery={preloadedUserQuery} />
    </div>
  );
};

export default Page;
