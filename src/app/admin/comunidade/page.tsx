import { createClient } from "@/lib/supabase/server";
import { getAdminInboxRows } from "@/lib/conversations";
import { AdminInboxList } from "@/components/admin/inbox-list";

export default async function AdminComunidadePage() {
  const supabase = await createClient();
  const rows = await getAdminInboxRows(supabase);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <AdminInboxList initialRows={rows} />
    </div>
  );
}
