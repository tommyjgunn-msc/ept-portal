// pages/test-result.js — the full breakdown.
//
// This page had no loading or error design at all: bare `<div>Loading your
// results...</div>` and `<div>Error: …</div>`, unstyled, on a dark body. It now
// uses the same skeleton and error patterns as the rest of the portal, and the
// scores are a table with tabular figures rather than three progress bars.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../components/UIDesignSystem';
import { SkeletonTable, ErrorState } from '../components/LoadingStates';
import PaperFooter from '../components/PaperFooter';

const TEST_TYPES = ['reading', 'writing', 'listening'];

export default function TestResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const userData = sessionStorage.getItem('userData');
        if (!userData) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/test-results?student_id=${JSON.parse(userData).eptId}`);
        if (!response.ok) throw new Error('We could not load your results.');

        setResults(await response.json());
      } catch (err) {
        setError(err.message || 'We could not load your results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ftm-night">
        <div className="max-w-shell mx-auto px-6 sm:px-10 py-12" aria-busy="true">
          <div className="ftm-skeleton h-8 w-56 mb-3" />
          <div className="ftm-skeleton h-4 w-72 mb-10" />
          <SkeletonTable rows={3} columns={4} className="max-w-[720px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ftm-night flex items-center">
        <div className="w-full max-w-shell mx-auto px-6 sm:px-10">
          <ErrorState
            title="We could not load your results"
            message={`${error} Your submitted work is not affected.`}
            onRetry={() => router.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ftm-night flex flex-col">
      <div className="flex-1 w-full max-w-shell mx-auto px-6 sm:px-10 py-12">
        <div className="max-w-[720px]">
          <h1 className="font-grotesk font-bold text-[30px] text-ftm-ink mb-2">Your results</h1>
          <p className="font-inter text-[15px] text-ftm-mut mb-10 max-w-measure">
            Reading and listening are marked automatically. Writing is checked by Writing Centre
            staff before it is final.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full font-inter text-[14px] border-collapse min-w-[520px]">
              <caption className="sr-only">Your marks for each section</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                    Section
                  </th>
                  <th scope="col" className="text-left font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                    Submitted
                  </th>
                  <th scope="col" className="text-right font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                    Attempts
                  </th>
                  <th scope="col" className="text-right font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 border-b border-ftm-line2">
                    Mark
                  </th>
                </tr>
              </thead>
              <tbody>
                {TEST_TYPES.map((type) => {
                  const testResult = results?.[type];

                  return (
                    <tr key={type}>
                      <th scope="row" className="text-left py-4 pr-4 border-b border-ftm-line align-top font-semibold text-ftm-ink capitalize">
                        {type}
                      </th>
                      <td className="py-4 pr-4 border-b border-ftm-line align-top text-ftm-mut tabular-nums whitespace-nowrap">
                        {testResult?.submission_date
                          ? new Date(testResult.submission_date).toLocaleString('en-GB', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : <span className="text-ftm-dim">Not submitted</span>}
                      </td>
                      <td className="py-4 pr-4 border-b border-ftm-line align-top text-right tabular-nums text-ftm-mut">
                        {testResult?.attempts > 1 ? testResult.attempts : '1'}
                      </td>
                      <td className="py-4 border-b border-ftm-line align-top text-right whitespace-nowrap">
                        {!testResult ? (
                          <span className="text-ftm-dim">—</span>
                        ) : type === 'writing' && testResult.score === null ? (
                          <span className="ftm-status font-semibold text-ftm-ochre justify-end">Being marked</span>
                        ) : (
                          <span className="font-grotesk font-bold text-[17px] text-ftm-ink tabular-nums">
                            {testResult.score}<span className="text-ftm-dim font-normal">/{testResult.total_points}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-l-[6px] border-ftm-ochre pl-4 py-1 mt-10">
            <p className="font-inter text-[15px] leading-relaxed text-ftm-mut">
              A mark shown here is provisional until the Writing Centre releases results. If a
              section looks wrong, email them with your EPT ID and the date you sat.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-ftm-line">
            <Button variant="ghost" onClick={() => router.push('/home')}>
              Back to my dashboard
            </Button>
          </div>
        </div>
      </div>

      <PaperFooter tone="night" />
    </div>
  );
}
