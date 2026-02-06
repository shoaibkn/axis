import { preloadAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import Header from "./Header";

export default async function Page() {
  const [preloadedUserQuery] = await Promise.all([
    preloadAuthQuery(api.auth.getCurrentUser),
    // Load multiple queries in parallel if needed
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Header preloadedUserQuery={preloadedUserQuery} />
      {JSON.stringify(preloadedUserQuery)}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
