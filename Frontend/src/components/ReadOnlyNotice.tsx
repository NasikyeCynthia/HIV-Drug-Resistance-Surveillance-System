// Shown instead of an edit form when the user may view a page but not change it.
export function ReadOnlyNotice({ who }: { who: string }) {
  return (
    <div role="note" className="rounded-md border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700">
      <strong>View only.</strong> {who} can make changes on this page. You can review the information.
    </div>
  );
}
