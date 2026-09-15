import { createFileRoute } from "@tanstack/react-router";
import { UserProfileView } from "./_app.user.$username";

export const Route = createFileRoute("/_authenticated/_app/profile/$userId")({
  head: () => ({ meta: [{ title: "User Profile — Omnicraft" }] }),
  component: ProfileUserIdPage,
});

function ProfileUserIdPage() {
  const { userId } = Route.useParams();
  return <UserProfileView identifier={userId} />;
}
