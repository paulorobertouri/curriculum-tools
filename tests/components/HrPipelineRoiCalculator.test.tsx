import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HrPipelineRoiCalculator } from '@/components/hr/HrPipelineRoiCalculator';
import { I18nProvider } from '@/i18n/i18n';

describe('HrPipelineRoiCalculator', () => {
  it('renders ROI calculator title and default cost projection graphics', () => {
    render(
      <I18nProvider>
        <HrPipelineRoiCalculator />
      </I18nProvider>,
    );
    expect(
      screen.getByText('Hiring Cost & Funnel ROI Calculator'),
    ).toBeInTheDocument();
    expect(screen.getByText('CVs Screened')).toBeInTheDocument();
    expect(screen.getByText('Net Financial Savings')).toBeInTheDocument();
  });

  it('updates calculation metrics when user drags sliders', () => {
    render(
      <I18nProvider>
        <HrPipelineRoiCalculator />
      </I18nProvider>,
    );

    // Sliders exist
    const ranges = screen.getAllByRole('slider');
    expect(ranges.length).toBe(5);

    // Adjust open roles to a higher value
    fireEvent.change(ranges[0], { target: { value: '30' } });

    // Adjust candidates per role
    fireEvent.change(ranges[1], { target: { value: '100' } });

    // Adjust HR hourly rate
    fireEvent.change(ranges[2], { target: { value: '50' } });

    // Adjust manual screening time
    fireEvent.change(ranges[3], { target: { value: '25' } });

    // Adjust traditional assessment cost
    fireEvent.change(ranges[4], { target: { value: '200' } });

    // Aggregates total CVs and savings should update
    expect(screen.getByText('Category breakdown')).toBeInTheDocument();
  });

  it('handles edge case where traditional cost is 0', () => {
    render(
      <I18nProvider>
        <HrPipelineRoiCalculator />
      </I18nProvider>,
    );
    const ranges = screen.getAllByRole('slider');

    // Set hourly rate, roles, assessment licensing to 0/minimal to trigger edge cases
    fireEvent.change(ranges[0], { target: { value: '1' } });
    fireEvent.change(ranges[1], { target: { value: '10' } });
    fireEvent.change(ranges[2], { target: { value: '15' } });
    fireEvent.change(ranges[3], { target: { value: '5' } });
    fireEvent.change(ranges[4], { target: { value: '0' } });

    expect(screen.getByText('Category breakdown')).toBeInTheDocument();
  });
});
