import { useId } from 'react';

export function TextArea({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  rows: number;
  placeholder?: string;
  onChange(value: string): void;
}) {
  const id = useId();

  return (
    <div className='space-y-2'>
      <label className='field-label' htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className='text-input resize-y'
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}
