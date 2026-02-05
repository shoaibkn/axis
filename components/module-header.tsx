export default function ModuleHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full border-b">{children}</div>;
}
