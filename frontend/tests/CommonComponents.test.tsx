import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/common/Button';
import { Card } from '@/common/Card';
import { List } from '@/common/List';
import { LongTextBlock } from '@/common/LongTextBlock';
import { MetricBar } from '@/common/MetricBar';
import { Score } from '@/common/Score';
import { TextArea } from '@/common/TextArea';
import { TextField } from '@/common/TextField';
import { I18nProvider } from '@/common/i18n';

describe('Common Components', () => {
  describe('Button', () => {
    it('renders correctly with primary variant by default', () => {
      render(
        <I18nProvider>
          <Button>Click me</Button>
        </I18nProvider>,
      );
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('bg-slate-950');
    });

    it('renders secondary and danger variants correctly', () => {
      const { rerender } = render(
        <I18nProvider>
          <Button variant='secondary'>Secondary</Button>
        </I18nProvider>,
      );
      expect(screen.getByRole('button').className).toContain('bg-sky-100');

      rerender(
        <I18nProvider>
          <Button variant='danger'>Danger</Button>
        </I18nProvider>,
      );
      expect(screen.getByRole('button').className).toContain('bg-red-100');
    });
  });

  describe('Card', () => {
    it('renders child content, title and subtitle', () => {
      render(
        <I18nProvider>
          <Card title='Card Title' subtitle='Card Subtitle'>
            <p>Card Content</p>
          </Card>
        </I18nProvider>,
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });
  });

  describe('List', () => {
    it('renders list of strings', () => {
      render(
        <I18nProvider>
          <List title='My List' items={['Item 1', 'Item 2']} />
        </I18nProvider>,
      );
      expect(screen.getByText('My List')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders empty message when no items', () => {
      render(
        <I18nProvider>
          <List title='My List' items={[]} />
        </I18nProvider>,
      );
      // t('result.noItems') is 'No items returned.' in English
      expect(screen.getByText(/No items returned/i)).toBeInTheDocument();
    });
  });

  describe('Score', () => {
    it('renders score', () => {
      render(
        <I18nProvider>
          <Score value={8.5} />
        </I18nProvider>,
      );
      expect(screen.getByText(/Score/i)).toBeInTheDocument();
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });
  });

  describe('TextField', () => {
    it('renders label and input', () => {
      render(
        <I18nProvider>
          <TextField label='Name' value='John' onChange={() => {}} />
        </I18nProvider>,
      );
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });
  });

  describe('TextArea', () => {
    it('renders label and textarea', () => {
      render(
        <I18nProvider>
          <TextArea label='Bio' value='Stuff' onChange={() => {}} />
        </I18nProvider>,
      );
      expect(screen.getByText('Bio')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Stuff')).toBeInTheDocument();
    });
  });

  describe('LongTextBlock', () => {
    it('renders title and content', () => {
      render(
        <I18nProvider>
          <LongTextBlock title='Summary' text='This is a long text.' />
        </I18nProvider>,
      );
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('This is a long text.')).toBeInTheDocument();
    });

    it('renders empty message when no text', () => {
      render(
        <I18nProvider>
          <LongTextBlock title='Summary' text='' />
        </I18nProvider>,
      );
      expect(screen.getByText(/No items returned/i)).toBeInTheDocument();
    });
  });

  describe('MetricBar', () => {
    it('renders label and value', () => {
      render(
        <I18nProvider>
          <MetricBar label='Fit' value={8.5} />
        </I18nProvider>,
      );
      expect(screen.getByText('Fit')).toBeInTheDocument();
      expect(screen.getByText('8.5/10')).toBeInTheDocument();
    });

    it('clamps value between 0 and 10', () => {
      const { rerender } = render(
        <I18nProvider>
          <MetricBar label='Fit' value={15} />
        </I18nProvider>,
      );
      expect(screen.getByText('10.0/10')).toBeInTheDocument();

      rerender(
        <I18nProvider>
          <MetricBar label='Fit' value={-5} />
        </I18nProvider>,
      );
      expect(screen.getByText('0.0/10')).toBeInTheDocument();
    });
  });
});
