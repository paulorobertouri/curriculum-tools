import { CandidateReviewInput, HrRankingInput } from '@/common/core/aiTypes';

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
  {
    id: 'candidate-fullstack-junior',
    name: 'Candidate Fullstack Junior',
    input: {
      jobTitle: 'Senior Full Stack Developer',
      jobDescription:
        'Architect secure fullstack apps, optimize Postgres databases at scale, and lead a team of 5 engineers.',
      cvText:
        'Junior full stack dev. Assisted with HTML, CSS and simple React bugs. Familiar with Git and MySQL queries under supervision. Eager to learn.',
    },
  },
  {
    id: 'candidate-devops-senior',
    name: 'Candidate DevOps Senior',
    input: {
      jobTitle: 'Lead DevOps Architect',
      jobDescription:
        'Design Kubernetes cluster topologies, manage multi-region AWS cloud infra via Terraform, and build CI/CD automation.',
      cvText:
        'DevOps Architect with 8 years experience. Architected global Kubernetes platform on AWS using Terraform. Automating builds with GitHub Actions, Jenkins, and Ansible. Deep Linux sysadmin skills.',
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
  {
    id: 'hr-senior-engineer',
    name: 'HR Senior Engineer Batch',
    input: {
      jobTitle: 'Senior Software Engineer',
      jobDescription:
        'Build highly scalable backend systems, write clean tests, mentor junior engineers, and participate in code reviews.',
      cvs: [
        {
          id: 'se-candidate-1',
          filename: 'dave.txt',
          text: 'Backend developer with 10 years experience. Expert in distributed systems, high throughput stream processing, and SQL optimizations.',
        },
        {
          id: 'se-candidate-2',
          filename: 'ellen.txt',
          text: 'Junior Frontend developer. Focused on UI tweaks and CSS styling.',
        },
        {
          id: 'se-candidate-3',
          filename: 'frank.txt',
          text: 'Mid-level backend dev. Strong Python, Django, writing APIs and unit tests. Enthusiastic about clean code and learning Kubernetes.',
        },
        {
          id: 'se-candidate-4',
          filename: 'grace.txt',
          text: 'Senior tech lead. Led design of real-time messaging, mentored 5 engineers, did daily reviews, strong advocate of TDD.',
        },
        {
          id: 'se-candidate-5',
          filename: 'heidi.txt',
          text: 'Product manager with basic HTML skills. Great at requirements and coordination but no coding experience.',
        },
      ],
    },
  },
];
