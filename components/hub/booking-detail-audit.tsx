import { formatCentralDateTime } from "@/lib/hub/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditRow = {
  id: string;
  action: string;
  created_at: string;
  profiles: { full_name?: string | null; email?: string | null } | null;
};

export function BookingDetailAudit({ rows }: { rows: AuditRow[] }) {
  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Audit log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        {!rows.length ? (
          <p className="px-4 py-6 text-center font-mono text-xs text-muted-foreground">
            No audit entries yet.
          </p>
        ) : (
          <div className="max-h-64 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 font-mono text-[9px] uppercase">
                    When
                  </TableHead>
                  <TableHead className="px-4 font-mono text-[9px] uppercase">
                    Action
                  </TableHead>
                  <TableHead className="px-4 font-mono text-[9px] uppercase">
                    By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const actor = row.profiles;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                        {formatCentralDateTime(row.created_at)}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className="font-mono text-[9px] uppercase">
                          {row.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 text-sm">
                        {actor?.full_name || actor?.email || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
