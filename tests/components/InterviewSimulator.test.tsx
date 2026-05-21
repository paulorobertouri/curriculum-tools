import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InterviewSimulator } from '@/components/candidate/InterviewSimulator';
import { I18nProvider } from '@/i18n/i18n';

const MOCK_QUESTIONS = [
  {
    question: 'How do you deploy microservices?',
    suggestedAnswer:
      'Deploy microservices utilizing Docker containers and Kubernetes orchestrations on AWS, ensuring CI/CD pipeline automation.',
  },
  {
    question: 'What is React virtual DOM?',
    suggestedAnswer:
      'React virtual DOM is a lightweight representation of real DOM, optimized using reconciliation to boost rendering performance.',
  },
];

describe('InterviewSimulator', () => {
  it('renders interview simulator with instructions and sidebar list', () => {
    render(
      <I18nProvider>
        <InterviewSimulator questions={MOCK_QUESTIONS} />
      </I18nProvider>,
    );
    expect(
      screen.getByText('Mock Interview Q&A Simulator'),
    ).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
  });

  it('grades answers and shows semantic keyword matching overlays', () => {
    render(
      <I18nProvider>
        <InterviewSimulator questions={MOCK_QUESTIONS} />
      </I18nProvider>,
    );

    // Select first question, draft response and submit
    const textarea = screen.getByPlaceholderText(/Type your answer here/i);
    fireEvent.change(textarea, {
      target: {
        value:
          'I deploy microservices using Docker containers and Kubernetes on AWS cloud infrastructure.',
      },
    });

    const submitBtn = screen.getByRole('button', { name: /Check approach/i });
    fireEvent.click(submitBtn);

    // Grading feedback should render matched terms
    expect(screen.getByText(/Content Match:/i)).toBeInTheDocument();
    expect(screen.getByText('docker')).toBeInTheDocument();
    expect(screen.getByText('kubernetes')).toBeInTheDocument();
    expect(screen.getByText('aws')).toBeInTheDocument();

    // Retake the question
    const retakeBtn = screen.getByTitle('Reset');
    fireEvent.click(retakeBtn);
    expect(
      screen.getByPlaceholderText(/Type your answer here/i),
    ).toBeInTheDocument();
  });

  it('allows question switching from sidebar list', () => {
    render(
      <I18nProvider>
        <InterviewSimulator questions={MOCK_QUESTIONS} />
      </I18nProvider>,
    );

    // The buttons are the arrows. Index 0 is prev, Index 1 is next.
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[1];

    fireEvent.click(nextBtn);
    expect(
      screen.getByText(/What is React virtual DOM\?/i),
    ).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('renders empty feedback if questions list is empty', () => {
    render(
      <I18nProvider>
        <InterviewSimulator questions={[]} />
      </I18nProvider>,
    );
    expect(
      screen.getByText('No interview questions found'),
    ).toBeInTheDocument();
  });
});
