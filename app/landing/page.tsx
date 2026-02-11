import { api } from "@/convex/_generated/api";
import {
  isAuthenticated,
  preloadAuthQuery,
} from "@/lib/auth-server";
import Header from "./header";

const Page = async () => {
  const authenticated = await isAuthenticated();
  const preloadedUserQuery = authenticated
    ? await preloadAuthQuery(api.auth.getCurrentUser)
    : undefined;

  return (
    <div>
      <Header preloadedUserQuery={preloadedUserQuery} />
    </div>
  );
};

export default Page;
