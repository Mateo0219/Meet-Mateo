import { redirect } from "next/navigation";

// The old static page now lives inside Mateo OS; keep existing links working.
export default function MomentsPage() {
  redirect("/#moments");
}
