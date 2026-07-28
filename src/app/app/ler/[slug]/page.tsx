import { notFound } from "next/navigation";
import { catalog } from "@/lib/mock-data";
import { getMockBody } from "@/lib/mock-content";
import { ReaderView } from "@/components/reader/reader-view";

export default async function LerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = catalog.find((item) => item.slug === slug);

  if (!content) {
    notFound();
  }

  const body = getMockBody(content.title);

  return <ReaderView content={content} body={body} />;
}
