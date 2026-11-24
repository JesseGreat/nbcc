/** Re-mounts on every admin-page navigation, giving each page a soft fade-in. */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="nbcc-page">{children}</div>;
}
