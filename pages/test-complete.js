// pages/test-complete.js — what you submitted, and where each section stands.
//
// This page is a status report, so it is now a table: three rows, real column
// headers, scores right-aligned in tabular figures so they compare down the
// column. What went: a green circle with a tick, a card per section, an icon
// medallion tinted by state, and two separate progress bars per row that
// encoded the same number as the text beside them.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../components/UIDesignSystem';
import { SkeletonTable, ErrorState } from '../components/LoadingStates';
import PaperFooter from '../components/PaperFooter';

const TEST_TYPES = ['reading', 'writing', 'listening'];

export default function TestComplete() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const storedUserData = sessionStorage.getItem('userData');
        const storedBookingDetails = sessionStorage.getItem('bookingDetails');

        if (!storedUserData || !storedBookingDetails) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(storedUserData);
        if (!userData.eptId) { router.push('/login'); return; }

        const response = await fetch(`/api/test-results?student_id=${userData.eptId}`);
        if (!response.ok) throw new Error('We could not load your sections.');

        setResults(await response.json());
      } catch (err) {
        setError(err.message || 'Something went wrong loading your sections.');
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
          <div className="ftm-skeleton h-8 w-64 mb-3" />
          <div className="ftm-skeleton h-4 w-48 mb-10" />
          <SkeletonTable rows={3} columns={3} className="max-w-[720px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ftm-night flex items-center">
        <div className="w-full max-w-shell mx-auto px-6 sm:px-10">
          <ErrorState
            title="We could not load your sections"
            message={`${error} Your submitted work is not affected.`}
            onRetry={() => router.reload()}
          />
          <div className="px-6 mt-2">
            <Button variant="ghost" onClick={() => router.push('/home')}>Back to my dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const getTestStatus = (type) => {
    if (!results?.[type]) return { status: 'not_started', label: 'Not started', mark: null };
    const t = results[type];
    const hasResponses = t.responses && Object.keys(t.responses).length > 0;

    if (type === 'writing' && hasResponses && t.score === null) {
      return { status: 'pending', label: 'Being marked', mark: null };
    }
    if (t.completed && hasResponses) {
      return {
        status: 'completed',
        label: t.score !== null ? 'Marked' : 'Submitted',
        mark: t.score !== null ? `${t.score}/${t.total_points}` : null,
      };
    }
    if (hasResponses) return { status: 'incomplete', label: 'Incomplete', mark: null };
    return { status: 'not_started', label: 'Not started', mark: null };
  };

  const done = TEST_TYPES.filter(t => ['completed', 'pending'].includes(getTestStatus(t).status));
  const allCompleted = done.length === TEST_TYPES.length;

  const statusColour = {
    completed: 'text-ftm-green',
    pending: 'text-ftm-ochre',
    incomplete: 'text-ftm-ochre',
    not_started: 'text-ftm-dim',
  };

  return (
    <div className="min-h-screen bg-ftm-night flex flex-col">
      <div className="flex-1 w-full max-w-shell mx-auto px-6 sm:px-10 py-12">
        <div className="max-w-[720px]">
          <h1 className="font-grotesk font-bold text-[30px] text-ftm-ink mb-2">
            {allCompleted ? 'All three sections submitted' : 'Your sections'}
          </h1>
          <p className="font-inter text-[15px] text-ftm-mut mb-10">
            {allCompleted
              ? 'Nothing more is needed from you. The Writing Centre releases results once marking has been checked.'
              : <><span className="tabular-nums font-semibold text-ftm-ink">{done.length}</span> of{' '}
                 <span className="tabular-nums">{TEST_TYPES.length}</span> submitted.</>}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full font-inter text-[14px] border-collapse min-w-[480px]">
              <caption className="sr-only">Your three exam sections and their current state</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                    Section
                  </th>
                  <th scope="col" className="text-left font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                    Submitted
                  </th>
                  <th scope="col" className="text-left font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                    State
                  </th>
                  <th scope="col" className="text-right font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 border-b border-ftm-line2">
                    Mark
                  </th>
                </tr>
              </thead>
              <tbody>
                {TEST_TYPES.map((type) => {
                  const status = getTestStatus(type);
                  const testData = results?.[type];

                  return (
                    <tr key={type}>
                      <th scope="row" className="text-left py-4 pr-4 border-b border-ftm-line align-top font-semibold text-ftm-ink capitalize">
                        {type}
                      </th>
                      <td className="py-4 pr-4 border-b border-ftm-line align-top text-ftm-mut tabular-nums whitespace-nowrap">
                        {testData?.submission_date
                          ? new Date(testData.submission_date).toLocaleString('en-GB', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-4 pr-4 border-b border-ftm-line align-top">
                        <span className={`ftm-status font-semibold ${statusColour[status.status]}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 border-b border-ftm-line align-top text-right tabular-nums font-semibold text-ftm-ink whitespace-nowrap">
                        {status.mark || <span className="text-ftm-dim font-normal">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {TEST_TYPES.some(t => getTestStatus(t).status === 'pending') && (
            <div className="border-l-[6px] border-ftm-ochre pl-4 py-1 mt-8">
              <p className="font-inter text-[15px] leading-relaxed text-ftm-mut">
                Writing is marked out of 50, first by a language model and then checked by Writing
                Centre staff. A mark shown here is not final until that check is done.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-ftm-line">
            {allCompleted && (
              <Button variant="primary" onClick={() => router.push('/test-result')}>
                See the full breakdown
              </Button>
            )}
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
