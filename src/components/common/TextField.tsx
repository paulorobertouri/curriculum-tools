import { useId } from 'react';

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  const id = useId();

  return (
    <div className='space-y-2'>
      <label className='field-label' htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className='text-input'
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}
