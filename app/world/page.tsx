import { redirect } from "next/navigation";

// The island is the home page now; keep the old address working.
export default function WorldPage() {
  redirect("/");
}
