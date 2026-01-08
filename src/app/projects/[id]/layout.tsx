export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The parent projects/layout.tsx already provides the sidebar navigation
  // This layout just passes through children
  return <>{children}</>;
}
