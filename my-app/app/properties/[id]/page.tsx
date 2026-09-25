import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProperty } from "@/lib/api-server";
import { formatUsd } from "@/lib/format";
import { PropertyDetail } from "@/components/property-detail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return { title: "Listing not found — Kireeye" };

  const title = `${property.neighborhood}, ${property.city} · ${formatUsd(property.price)}/month — Kireeye`;
  return {
    title,
    description: property.description.slice(0, 160),
    openGraph: { title, images: property.images.slice(0, 1) },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return <PropertyDetail property={property} />;
}
