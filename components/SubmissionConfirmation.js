// components/SubmissionConfirmation.js — the last screen before a section is
// sent. This is the highest-stakes confirm in the product: it cannot be undone.
// So it states the consequence in words, shows the counts in tabular figures,
// and makes "go back" as easy to reach as "submit".
import { Button } from './UIDesignSystem';

export default function SubmissionConfirmation({ testType, responses, wordCounts, onConfirm, onCancel, isSubmitting }) {
  const responseCount = Object.keys(responses || {}).length;
  const sectionName = testType.charAt(0).toUpperCase() + testType.slice(1);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
      role="alertdialog"
      aria-modal="true"
      aria-label={`Submit the ${testType} section`}
    >
      <div className="w-full max-w-[560px] bg-ftm-card border border-ftm-line2">
        <div className="px-6 py-5 border-b border-ftm-line">
          <h2 className="font-grotesk font-bold text-[21px] text-ftm-ink">
            Submit the {testType} section?
          </h2>
        </div>

        <div className="px-6 py-5">
          <dl className="ftm-facts mb-6">
            <div>
              <dt className="k">Section</dt>
              <dd className="v">{sectionName}</dd>
            </div>
            {testType === 'writing' ? (
              <>
                <div>
                  <dt className="k">Prompts answered</dt>
                  <dd className="v tabular-nums">{responseCount}</dd>
                </div>
                {wordCounts && Object.entries(wordCounts).map(([key, count]) => (
                  <div key={key}>
                    <dt className="k">Prompt {parseInt(key.split('-')[1]) + 1}</dt>
                    <dd className="v tabular-nums">{count} words</dd>
                  </div>
                ))}
              </>
            ) : (
              <div>
                <dt className="k">Questions answered</dt>
                <dd className="v tabular-nums">{responseCount}</dd>
              </div>
            )}
          </dl>

          {responseCount === 0 && (
            <div className="border-l-[6px] border-ftm-ochre pl-4 py-1 mb-6">
              <p className="font-inter font-bold text-[15px] text-ftm-ochre mb-1">
                Nothing has been answered
              </p>
              <p className="font-inter text-[15px] leading-relaxed text-ftm-mut">
                Submitting now records this section as a zero. Go back if you still have time.
              </p>
            </div>
          )}

          <p className="font-inter text-[15px] leading-relaxed text-ftm-mut mb-6">
            Once submitted you cannot reopen this section or change your answers.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary" onClick={onConfirm} loading={isSubmitting}>
              {isSubmitting ? 'Submitting' : `Submit ${testType}`}
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Go back and keep working
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
