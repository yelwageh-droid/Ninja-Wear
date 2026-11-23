// Dark pulsing placeholder used while a route or panel loads / بديل متحرك أثناء التحميل
export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[#18181B] ${className}`} />;
}
