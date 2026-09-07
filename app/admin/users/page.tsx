import { HqAppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { setAccountStatusAction } from "@/app/actions/admin";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  await requireSession("ADMIN");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 80 });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <HqAppNav current="/admin/users" />
      <h1 className="text-3xl font-bold text-ink">Users</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-line">
                <td className="p-3 font-medium text-ink">
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td className="p-3">
                  <form action={setAccountStatusAction} className="flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <Button name="status" value={user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} size="sm" variant="secondary">
                      {user.status === "SUSPENDED" ? "Restore" : "Suspend"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
