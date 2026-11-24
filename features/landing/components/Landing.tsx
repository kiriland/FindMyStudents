import About from "./About";
import Departments from "./Departments";
import Faq from "./Faq";
import FinalCta from "./FinalCta";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Roles from "./Roles";
import WhyStudents from "./WhyStudents";

export default function Landing() {
  return (
    <main id="main" className="w-full flex-1 overflow-x-clip">
      <Hero />
      <About />
      <HowItWorks />
      <Departments />
      <WhyStudents />
      <Roles />
      <Faq />
      <FinalCta />
    </main>
  );
}
