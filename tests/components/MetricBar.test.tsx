import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MetricBar } from '@/components/common/MetricBar';

describe('MetricBar', () => {
  it('renders correctly with given value', () => {
    render(<MetricBar label='Fit Score' value={8.5} />);

    expect(screen.getByText('Fit Score')).toBeInTheDocument();
    expect(screen.getByText('8.5/10')).toBeInTheDocument();
  });

  it('clamps value between 0 and 10', () => {
    const { rerender } = render(<MetricBar label='Fit Score' value={15} />);
    expect(screen.getByText('10.0/10')).toBeInTheDocument();

    rerender(<MetricBar label='Fit Score' value={-5} />);
    expect(screen.getByText('0.0/10')).toBeInTheDocument();
  });
});
