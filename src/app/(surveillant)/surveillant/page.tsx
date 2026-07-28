import { redirect } from "next/navigation";

// L'espace surveillant n'a qu'une rubrique : on entre directement dessus.
export default function SurveillantHome() {
  redirect("/surveillant/presences");
}
