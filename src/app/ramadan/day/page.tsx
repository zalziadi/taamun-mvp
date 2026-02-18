import TaamunDayPage from "./TaamunDayPage";

interface PageProps {
  searchParams: Promise<{ day?: string }>;
}

export default async function RamadanDayRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const day = Math.min(28, Math.max(1, Number(params.day ?? "1")));
  return <TaamunDayPage day={day} />;
}
