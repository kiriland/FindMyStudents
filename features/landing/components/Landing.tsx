export default function Landing() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-20 lg:px-16 lg:py-28">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tighter wrap-anywhere sm:text-5xl lg:text-6xl">
          FindMyStudents
        </h1>
        <p className="text-base leading-8 text-pretty text-zinc-600 dark:text-zinc-300 sm:text-lg">
          FindMyStudents is a platform that connects Baruch students with peers.
        </p>
      </div>
    </main>
  );
}
