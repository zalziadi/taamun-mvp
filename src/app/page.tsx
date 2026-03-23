import { HomeLanding } from "./HomeLanding";

type HomePageProps = {
  searchParams?: Promise<{
    ramadan?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const sp = searchParams ? await searchParams : {};
  const isRamadanClosed = sp.ramadan === "closed";

  return <HomeLanding ramadanClosed={isRamadanClosed} />;
}
