import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminAlunosPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: purchases }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, created_at")
      .eq("is_admin", false)
      .order("created_at", { ascending: false }),
    supabase.from("purchases").select("user_id, contents(price)"),
  ]);

  const byStudent = new Map<string, { count: number; total: number }>();
  for (const p of purchases ?? []) {
    const entry = byStudent.get(p.user_id) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += p.contents?.price ?? 0;
    byStudent.set(p.user_id, entry);
  }

  const rows = (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name ?? "Aluna",
    email: profile.email ?? "",
    joinedAt: profile.created_at,
    courseCount: byStudent.get(profile.id)?.count ?? 0,
    totalSpent: byStudent.get(profile.id)?.total ?? 0,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="text-sm text-muted-foreground">{rows.length} aluna(s) cadastrada(s).</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma aluna cadastrada ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-card/60 text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Cursos</th>
                <th className="px-5 py-3 font-medium">Total gasto</th>
                <th className="px-5 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/alunos/${row.id}`}
                      className="text-foreground hover:text-rose"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{row.email}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.courseCount}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatCurrency(row.totalSpent)}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(row.joinedAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
