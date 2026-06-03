"use client"
import BuilderV3 from "../BuilderV3"
export default function BuilderPage({ params }: { params: { pageId: string } }) {
  return <BuilderV3 pageId={params.pageId} />
}
