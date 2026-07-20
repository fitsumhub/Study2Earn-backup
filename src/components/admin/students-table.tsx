import { Pencil, Trash2, UserCheck } from "lucide-react";

import { statusStyles } from "@/components/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUser } from "@/lib/admin-types";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

export function StudentsTable({
  users,
  onView,
  onEdit,
  onMessage,
  onSuspend,
  onApprove,
  onReactivate,
  onDelete,
}: {
  users: AdminUser[];
  onView: (u: AdminUser) => void;
  onEdit?: (u: AdminUser) => void;
  onMessage: (u: AdminUser) => void;
  onSuspend: (u: AdminUser) => void;
  onApprove: (id: string) => void;
  onReactivate: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  if (users.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No students found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead className="hidden md:table-cell">University</TableHead>
          <TableHead className="hidden lg:table-cell">Program</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">XP</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => onEdit?.(user) ?? onView(user)}
              >
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.id}</p>
              </button>
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {user.university}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{user.program}</TableCell>
            <TableCell>
              <Badge variant="secondary" className={cn("capitalize", statusStyles[user.status])}>
                {user.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {user.xp > 0 ? user.xp.toLocaleString() : "—"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Pencil className="mr-2 size-4" />
                      Edit student
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onView(user)}>View profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMessage(user)}>Send message</DropdownMenuItem>
                  {user.status === "pending" && (
                    <DropdownMenuItem onClick={() => onApprove(user.id)}>
                      <UserCheck className="mr-2 size-4" />
                      Approve account
                    </DropdownMenuItem>
                  )}
                  {user.status === "suspended" && (
                    <DropdownMenuItem onClick={() => onReactivate(user.id)}>
                      <UserCheck className="mr-2 size-4" />
                      Reactivate account
                    </DropdownMenuItem>
                  )}
                  {user.status !== "suspended" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onSuspend(user)}
                      >
                        Suspend account
                      </DropdownMenuItem>
                    </>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(user.id)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete student
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
