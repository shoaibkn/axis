import NavWebsite from "@/components/nav-website";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavWebsite />
      {children}
    </>
  );
}
