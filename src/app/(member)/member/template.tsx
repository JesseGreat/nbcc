/** Re-mounts on every member-page navigation, giving each page a soft fade-in. */
export default function MemberTemplate({ children }: { children: React.ReactNode }) {
  return <div className="nbcc-page">{children}</div>;
}
