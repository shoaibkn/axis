// "use client";

// import { Button } from "@/components/ui/button";
// import { authClient } from "@/lib/auth-client";

// const Page = () => {
//   return (
//     <div className="flex flex-col items-center justify-center h-screen">
//       <Button
//         onClick={async () => {
//           await authClient.signIn.social({
//             provider: "github",
//             callbackURL: "/dashboard",
//           });
//         }}
//       >
//         Sign in with GitHub
//       </Button>
//     </div>
//   );
// };

// export default Page;

import { GalleryVerticalEnd } from "lucide-react";

import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </a>
        <SignupForm />
      </div>
    </div>
  );
}
