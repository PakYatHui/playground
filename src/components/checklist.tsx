export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 p-0 text-sm text-stone-700 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="list-none rounded-2xl border border-black/10 bg-[var(--surface-strong)] px-4 py-3 shadow-sm"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
