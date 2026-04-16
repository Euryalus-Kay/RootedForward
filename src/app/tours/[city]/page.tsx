import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ city: string }>;
}

export default async function CityTourPage({ params }: PageProps) {
  const { city } = await params;
  // Redirect city pages to the main tours page
  // Individual stop pages at /tours/[city]/[slug] still work
  redirect("/tours");
}
