export default function Landing() {
  return (
    <main className="mx-auto box-border flex w-full max-w-6xl flex-1 items-center justify-center px-[clamp(1.25rem,5vw,4rem)] py-[clamp(3rem,10vh,7rem)] text-center">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-[clamp(2rem,6vw,3.75rem)] leading-[1.15] font-bold tracking-[-.04em] wrap-anywhere">FindMyStudents</h1>
        <p className="text-[clamp(1rem,2vw,1.125rem)] leading-[1.85] text-pretty text-[color-mix(in_srgb,#171717_75%,#fff)] dark:text-[color-mix(in_srgb,#ededed_75%,#0a0a0a)]">
          FindMyStudents is a platform that connects Baruch students with peers.
        </p>
      </div>
    </main>
  );
}
