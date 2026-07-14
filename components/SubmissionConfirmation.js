// components/SubmissionConfirmation.js — Summary before final submission
import { Button } from './UIDesignSystem';

export default function SubmissionConfirmation({ testType, responses, wordCounts, onConfirm, onCancel, isSubmitting }) {
  const responseCount = Object.keys(responses || {}).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-ftm-card rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-ftm-ink mb-4">Submit {testType.charAt(0).toUpperCase() + testType.slice(1)} Test?</h3>

        <div className="bg-ftm-night rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ftm-mut">Test type</span>
            <span className="font-medium text-ftm-ink capitalize">{testType}</span>
          </div>

          {testType === 'writing' ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-ftm-mut">Prompts answered</span>
                <span className="font-medium text-ftm-ink">{responseCount}</span>
              </div>
              {wordCounts && Object.entries(wordCounts).map(([key, count]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-ftm-mut">Prompt {parseInt(key.split('-')[1]) + 1} words</span>
                  <span className="font-medium text-ftm-ink">{count}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-ftm-mut">Questions answered</span>
              <span className="font-medium text-ftm-ink">{responseCount}</span>
            </div>
          )}
        </div>

        {responseCount === 0 && (
          <div className="bg-ftm-amber/10 border border-ftm-amber/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-ftm-amber font-medium">
              You haven't answered any questions yet. Are you sure you want to submit?
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
            Go Back
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={isSubmitting} className="flex-1">
            {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
