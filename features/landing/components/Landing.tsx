
import Image from "next/image";
import Link from "next/link";

export default function Landing() {
  const features = [
    {
      number: "01",
      title: "Discover Classes",
      description:
        "Explore Baruch College courses and discover subjects that match your academic interests.",
    },
    {
      number: "02",
      title: "Find Study Partners",
      description:
        "Find opportunities to connect with students who share similar courses and academic goals.",
    },
    {
      number: "03",
      title: "Learn Together",
      description:
        "Build connections, exchange knowledge, and support each other throughout your college journey.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description:
        "Get started by signing up and joining the FindMyStudents community.",
    },
    {
      number: "02",
      title: "Explore Your Classes",
      description:
        "Search for courses and discover opportunities to connect with classmates.",
    },
    {
      number: "03",
      title: "Connect & Collaborate",
      description:
        "Find students with similar academic interests and start building connections.",
    },
  ];

  const faqs = [
    {
      question: "What is FindMyStudents?",
      answer:
        "FindMyStudents is a student-focused platform designed to help Baruch College students explore courses and find opportunities to connect with study partners and classmates.",
    },
    {
      question: "Who is FindMyStudents for?",
      answer:
        "The platform is designed for Baruch College students who want to find study partners, connect with classmates, and collaborate on academic goals.",
    },
    {
      question: "Is FindMyStudents free?",
      answer:
        "FindMyStudents is a student project intended to make academic connections more accessible. There is currently no subscription or payment feature.",
    },
    {
      question: "How do I find a study partner?",
      answer:
        "Start by exploring the course directory. The platform is being developed to help students discover classmates with similar courses and interests.",
    },
    {
      question: "Do I need an account?",
      answer:
        "You can explore the public pages, but student account features require registration and sign-in.",
    },
    {
      question: "Is FindMyStudents affiliated with Baruch College?",
      answer:
        "FindMyStudents is a student-developed academic project created for the Baruch College community. It is not an official Baruch College service.",
    },
  ];

  return (
    <main className="flex w-full flex-1 flex-col bg-white text-zinc-900">

      {/* HERO SECTION */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 flex justify-center">
            <Image
              src="/findmystudents-logo.png"
              alt="FindMyStudents - Connect, Study, Collaborate"
              width={650}
              height={220}
              priority
              className="h-auto w-full max-w-xl object-contain"
            />
          </div>

          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-blue-700">
            Built for Baruch College Students
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            Study smarter.
            <span className="mt-2 block text-blue-600">
              Connect together.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-600">
            FindMyStudents helps Baruch students explore classes,
            discover potential study partners, and build meaningful
            academic connections.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Explore Classes
            </Link>

            <Link
              href="/signup"
              className="rounded-xl border border-zinc-300 bg-white px-8 py-3.5 font-semibold text-zinc-900 transition hover:bg-zinc-100"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="w-full border-t border-zinc-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything starts with a connection
            </h2>

            <p className="mt-4 text-zinc-600">
              A simpler way to connect with your college community.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <p className="mb-6 text-sm font-bold text-blue-600">
                  {feature.number}
                </p>

                <h3 className="mb-3 text-xl font-semibold">
                  {feature.title}
                </h3>

                <p className="leading-7 text-zinc-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT THE PLATFORM */}
      <section className="w-full bg-white py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-600">
              About Our Platform
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What is FindMyStudents?
            </h2>

            <p className="mt-6 leading-8 text-zinc-600">
              FindMyStudents is a student-developed platform created
              to make academic connections easier for Baruch College
              students.
            </p>

            <p className="mt-4 leading-8 text-zinc-600">
              College can be challenging, especially when students
              struggle to find classmates who are taking the same
              courses or are interested in studying together.
            </p>

            <p className="mt-4 leading-8 text-zinc-600">
              Our goal is to provide a simple place where students
              can explore courses and discover opportunities to
              connect, collaborate, and succeed together.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-10">

            {/* CUSTOM LOGO - REPLACES OLD F */}
            <div className="mb-6 flex">
              <Image
                src="/favicon.ico"
                alt="FindMyStudents Logo"
                width={90}
                height={90}
                className="h-[90px] w-[90px] object-contain"
                unoptimized
              />
            </div>

            <h3 className="text-2xl font-bold text-zinc-900">
              A community built around learning
            </h3>

            <p className="mt-5 leading-8 text-zinc-600">
              Whether you are looking for classmates, study
              partners, or opportunities to share your knowledge,
              FindMyStudents is designed to make connecting with
              fellow students easier.
            </p>

            <div className="mt-8 rounded-xl border border-blue-100 bg-white p-5">
              <p className="font-semibold text-blue-700">
                Connect. Study. Collaborate.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Because learning is better when we support each other.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR MISSION */}
      <section className="w-full bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-600">
            Our Mission
          </p>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Helping Students Succeed Together
          </h2>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-9 text-zinc-600">
            Our mission is to make it easier for Baruch College
            students to find academic support, build connections,
            and learn from one another. We believe that every
            student deserves the opportunity to collaborate,
            share knowledge, and feel connected to their
            college community.
          </p>
        </div>
      </section>

      {/* WHY WE CREATED THIS */}
      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-600">
              Why We Created This
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Because Finding Help Should Be Easier
            </h2>

            <p className="mt-6 leading-8 text-zinc-600">
              Students often have different schedules, majors,
              and academic needs. Finding someone to study with
              should not be another challenge.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 p-7">
              <h3 className="text-lg font-bold text-blue-700">
                Better Connections
              </h3>
              <p className="mt-3 leading-7 text-zinc-600">
                Help students discover classmates who share
                similar courses and academic interests.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-7">
              <h3 className="text-lg font-bold text-blue-700">
                Academic Support
              </h3>
              <p className="mt-3 leading-7 text-zinc-600">
                Encourage students to learn from each other
                and build supportive study relationships.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-7">
              <h3 className="text-lg font-bold text-blue-700">
                Stronger Community
              </h3>
              <p className="mt-3 leading-7 text-zinc-600">
                Create more opportunities for collaboration
                across the Baruch College community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-600">
              Getting Started
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How FindMyStudents Works
            </h2>

            <p className="mt-4 text-zinc-600">
              Three simple steps to get started.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                  {step.number}
                </div>

                <h3 className="text-xl font-bold">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-600">
              Frequently Asked Questions
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Have Questions? We Have Answers.
            </h2>

            <p className="mt-4 text-zinc-600">
              Everything you need to know about FindMyStudents.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-blue-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-zinc-900">
                  {faq.question}

                  <span className="text-2xl font-normal text-blue-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 leading-7 text-zinc-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="w-full bg-blue-600 py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your Next Study Connection Starts Here
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            Explore courses, discover new connections, and take
            the first step toward a more collaborative
            college experience.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-8 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Get Started
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-blue-300 px-8 py-3.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Explore Classes
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-zinc-200 bg-slate-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:text-left">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">
              FindMyStudents
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Connect. Study. Collaborate.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              An independent student-developed project for
              the Baruch College community.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-zinc-600">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-blue-600">
              Log In
            </Link>
            <Link href="/signup" className="hover:text-blue-600">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
