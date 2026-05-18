import { CandidateReviewInput, HrRankingInput } from '@/domain/aiTypes';

export type CandidateFixture = {
  id: string;
  name: string;
  input: CandidateReviewInput;
};

export type HrFixture = {
  id: string;
  name: string;
  input: HrRankingInput;
};

export const candidateFixtures: CandidateFixture[] = [
  {
    id: 'candidate-frontend-mid',
    name: 'Candidate Frontend Mid',
    input: {
      jobTitle: 'Frontend Engineer',
      jobDescription:
        'Build React features, improve performance, and collaborate across product/design.',
      cvText:
        'Frontend engineer with 4 years building React apps. Reduced bundle size by 25%, improved CI reliability, mentored 2 junior developers, and collaborated with design to ship accessibility fixes.',
    },
  },
  {
    id: 'candidate-backend-senior',
    name: 'Candidate Backend Senior',
    input: {
      jobTitle: 'Senior Backend Engineer',
      jobDescription:
        'Design APIs, improve reliability, and lead architecture decisions for distributed systems.',
      cvText:
        'Backend engineer with Go and Node.js experience. Designed REST APIs, reduced p95 latency by 35%, and led migration to event-driven architecture. Limited direct mentoring examples.',
    },
  },
];

export const hrFixtures: HrFixture[] = [
  {
    id: 'hr-engineering-manager',
    name: 'HR Engineering Manager Batch',
    input: {
      jobTitle: 'Engineering Manager',
      jobDescription:
        'Lead teams, grow engineers, manage delivery risk, and align architecture with product goals.',
      cvs: [
        {
          id: 'fixture-candidate-a',
          filename: 'alice.txt',
          text: 'Led a team of 8 engineers, improved sprint predictability, and delivered platform migration on time.',
        },
        {
          id: 'fixture-candidate-b',
          filename: 'bob.txt',
          text: 'Strong IC engineer with React and Node expertise. Limited people management experience.',
        },
        {
          id: 'fixture-candidate-c',
          filename: 'carol.txt',
          text: 'Managed cross-functional delivery for infrastructure reliability, improved incident response process, and coached team leads.',
        },
      ],
    },
  },
];
