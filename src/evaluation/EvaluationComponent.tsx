import React, { useState } from 'react';
import { EvaluationService } from './EvaluationService';
import { EvaluationResult } from './EvaluationModels';

const service = new EvaluationService();

export const EvaluationComponent: React.FC = () => {
  /* 
     Application/Adapter Layer: Presentation of the evaluation results.
  */
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const data = await service.runReview({ cvText: '...', jobDescription: '...' });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Candidate Evaluation</h2>
      <button 
        onClick={handleRun}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Run Evaluation'}
      </button>

      {result && (
        <div className="mt-6">
          <div className="text-2xl font-semibold">Score: {result.review.score}/100</div>
          <p className="mt-2 text-gray-700">{result.review.summary}</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-bold text-green-700">Strengths</h3>
              <ul className="list-disc ml-5">
                {result.review.strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-red-700">Weaknesses</h3>
              <ul className="list-disc ml-5">
                {result.review.weaknesses.map(w => <li key={w}>{w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
