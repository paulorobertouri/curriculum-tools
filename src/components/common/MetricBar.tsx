export function MetricBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(
    0,
    Math.min(10, Number.isFinite(value) ? value : 0),
  );

  return (
    <div>
      <div className='mb-1 flex items-center justify-between text-xs font-semibold text-slate-700'>
        <span>{label}</span>
        <span>{safeValue.toFixed(1)}/10</span>
      </div>
      <div className='h-2 rounded-full bg-slate-200'>
        <div
          className='h-2 rounded-full bg-cyan-600 transition-all duration-300'
          style={{ width: `${safeValue * 10}%` }}
        />
      </div>
    </div>
  );
}
