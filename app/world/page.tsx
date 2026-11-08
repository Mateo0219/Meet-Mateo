import type { Metadata } from "next";
import WorldShell from "@/components/world/WorldShell";

export const metadata: Metadata = {
  title: "Mateo 岛",
  description: "今天换你来当 Mateo：一座可以走进去逛的小岛。",
};

export default function WorldPage() {
  return <WorldShell />;
}
