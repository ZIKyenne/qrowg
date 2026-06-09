"use client"
import BuilderV4 from "../BuilderV4"
export default function BuilderPage({ params }: { params: { pageId: string } }) {
  return <BuilderV4 pageId={params.pageId} />
}
