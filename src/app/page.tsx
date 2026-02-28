import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import "@/styles/hero.css";
import "@/styles/journey.css";
import "@/styles/days.css";

const Journey = dynamic(() => import("@/components/Journey"), {
  loading: () => <div style={{ minHeight: "50vh" }} />,
});

const DaysPath = dynamic(() => import("@/components/DaysPath"), {
  loading: () => <div style={{ minHeight: "40vh" }} />,
});

export default function Home() {
  return (
    <>
      <Hero />
      <Journey />
      <DaysPath />
    </>
  );
}
