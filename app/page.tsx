import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Lifestyle from "@/components/Lifestyle";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <Lifestyle />
      <Contact />
    </main>
  );
}
