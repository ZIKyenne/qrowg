import BuilderV4 from "../BuilderV4"

// Next.js 16 : params est une Promise, il faut l'awaiter avant usage.
export default async function BuilderPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params
  return <BuilderV4 pageId={pageId} />
}