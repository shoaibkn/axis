export default function FilterHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full border-b">{children}</div>;
}
