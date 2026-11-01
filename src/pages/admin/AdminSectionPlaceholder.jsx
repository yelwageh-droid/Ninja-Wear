export default function AdminSectionPlaceholder({ title }) {
  return (
    <section className="border-t border-white/10 pt-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Admin workspace</p>
      <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">This section will be implemented in its dedicated dashboard phase.</p>
    </section>
  );
}
