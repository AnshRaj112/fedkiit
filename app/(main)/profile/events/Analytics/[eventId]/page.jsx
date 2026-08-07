// Route entry for the per-event admin view — registration counts, year
// breakdown, the CSV export and the payment proofs.
//
// This route did not exist. `EventCard` has shipped an analytics button since
// the revamp that pushes to `/profile/events/Analytics/<id>`, and `EventStats`
// was written and exported from the modals barrel, but nothing ever mounted it
// — so the button 404'd and the component was dead code.
//
// Gated to ADMIN on the server, matching /profile/attendance: `proxy.ts` only
// checks for a valid session, not a role, so without this any signed-in
// participant who typed the path would see every registrant's email and
// payment screenshot.

import { redirect } from "next/navigation";

import { getCurrentUser, isAdmin } from "@/lib/auth/access";
import EventStats from "@/src/features/Modals/Event/EventStats/EventStats";

export default async function Page({ params }) {
  const { eventId } = await params;
  const user = await getCurrentUser();

  if (!user) redirect(`/Login?next=/profile/events/Analytics/${eventId}`);
  if (!isAdmin(user)) redirect("/profile");

  return <EventStats onClosePath="/profile/events" />;
}
