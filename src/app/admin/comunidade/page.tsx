import { createClient } from "@/lib/supabase/server";
import { getAdminInboxRows } from "@/lib/conversations";
import { AdminInboxList } from "@/components/admin/inbox-list";

export default async function AdminComunidadePage() {
  const supabase = await createClient();
  const rows = await getAdminInboxRows(supabase);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-2 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
        <span className="text-rose">✦</span>
        Chat
      </div>
      <h1 className="font-heading text-3xl text-foreground">Conversas com alunas</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Dúvidas enviadas pelas alunas sobre os cursos que adquiriram.
      </p>

      <AdminInboxList initialRows={rows} />
    </div>
  );
}
