import { redirect } from "next/navigation";

// The old static page now lives on Mateo Island; keep existing links working.
export default function MomentsPage() {
  redirect("/#moments");
}
