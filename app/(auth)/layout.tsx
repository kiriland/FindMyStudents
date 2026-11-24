export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="w-full flex-1">
      {children}
    </main>
  );
}
