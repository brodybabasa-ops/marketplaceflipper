import MechanicJobsList from "../_jobs-list";

export const metadata = { title: "Requests" };

export default function RequestsPage() {
  return <MechanicJobsList title="Pending requests" href="/mechanic/requests" statuses={["REQUESTED"]} />;
}
