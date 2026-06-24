import { getLoginAudit, getLoginAuditCount } from "@/db/queries";
import { AuditLogTable } from "@/components/admin/audit-log-table";

const PAGE_SIZE = 20;

const AdminAuditPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    getLoginAudit(offset, PAGE_SIZE),
    getLoginAuditCount(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return <AuditLogTable rows={rows} page={page} totalPages={totalPages} />;
};

export default AdminAuditPage;
