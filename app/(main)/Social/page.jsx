// /Social — content moved to /Insights; redirect so old links keep working.
import { redirect } from "next/navigation";

export default function SocialPage() {
  redirect("/Insights");
}
