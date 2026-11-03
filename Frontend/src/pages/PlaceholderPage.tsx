import { useAuth } from "../auth/AuthContext";
import type { Permission } from "../auth/permissions";
import { ReadOnlyNotice } from "../components/ReadOnlyNotice";

interface Props { title: string; editPerm?: Permission; editors?: string }

export function PlaceholderPage({ title, editPerm, editors }: Props) {
  const { can } = useAuth();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {editPerm && (can(editPerm)
        ? <p className="text-sm text-teal-700">You can add and edit information on this page.</p>
        : <ReadOnlyNotice who={editors ?? "Authorised staff"} />)}
      <p className="text-slate-500">This page is built in an upcoming step.</p>
    </div>
  );
}
