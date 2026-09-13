import { Button } from "@/components/ui/button";
import { setAccountStatusAction } from "@/app/actions/admin";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSession("ADMIN");
  const { q } = await searchParams;
  const term = q?.trim();
  const where: Prisma.UserWhereInput = term
    ? {
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ],
      }
    : {};
  const users = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 80 });
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-paper">
      {term ? <p className="border-b border-line px-3 py-2 text-sm text-muted">Showing matches for “{term}”.</p> : null}
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
            <tr key={user.id} className="border-b border-line last:border-0">
              <td className="p-3 font-medium text-navy">
                {user.firstName} {user.lastName}
              </td>
              <td>{user.email}</td>
              <td className="capitalize">{user.role.toLowerCase()}</td>
              <td className="capitalize">{user.status.toLowerCase()}</td>
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
  );
}
