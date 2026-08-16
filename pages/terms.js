// pages/terms.js
//
// The rules a candidate is actually held to, taken from the code that enforces
// them: the three-strike rule and the blocked shortcuts in ProctoringContext,
// the 10:00 unlock in components/Navigation.js, the one-attempt behaviour in
// pages/api/submit-test.js, and the section lengths shown on the dashboard.
//
// NOTE FOR THE TEAM: describes system behaviour, not legal advice. Have someone
// at ALU read it before treating it as policy.
import LegalPage, { Section, List } from '../components/LegalPage';

export default function Terms() {
  return (
    <LegalPage
      eyebrow="Futurimi · English Proficiency Test"
      title="Exam rules"
      standfirst="What you agree to when you sit Futurimi, and what the portal will do if you break it. Everything here is enforced by the software, so none of it is a matter of interpretation on the day."
      updated="16 August 2026"
    >
      <Section title="Booking and arriving">
        <p>
          You must book a sitting before you can take the exam. The portal unlocks at
          10:00 on the date you booked and not before. Sittings are at ALU Kigali.
        </p>
        <p>
          Places on each date are capped, separately for candidates bringing a laptop and
          candidates using a provided machine. When a date is full it stops appearing.
        </p>
      </Section>

      <Section title="During the exam">
        <p>The exam runs in fullscreen. While a section is open, the portal will block:</p>
        <List
          items={[
            'Copying, cutting and pasting, by menu or by keyboard.',
            'Right-clicking.',
            'Ctrl/Cmd+C, V, X and P, Print Screen, and F12.',
          ]}
        />
        <p>
          Leaving fullscreen, or switching to another tab or application, is recorded.
          Three of any one of these in a section submits that section automatically and
          you cannot return to it. You get a warning before each strike.
        </p>
      </Section>

      <Section title="Your own work">
        <p>
          The essay you submit must be written by you, in the room, during the section.
          Work drafted elsewhere and brought in, or produced by a language model, is not
          your own work.
        </p>
        <p>
          The portal records how fast your word count grows. If an essay appears in one or
          two jumps, staff will ask you about it. That is a question, not an accusation,
          and you will get the chance to answer it.
        </p>
      </Section>

      <Section title="Submitting">
        <p>
          Each section is submitted once. Once a section is submitted you cannot reopen or
          revise it.
        </p>
        <p>
          If the connection drops as you submit, your work is usually already saved. Submit
          again. If the portal tells you the section was already received, it was, and
          nothing has been lost.
        </p>
      </Section>

      <Section title="Your result">
        <p>
          Reading and listening are marked automatically. Writing is marked out of 50, first
          by a language model and then checked by Writing Centre staff, who can change any
          mark. A section you left empty is marked zero and flagged as no response, so that
          a genuine zero and a technical failure are never confused.
        </p>
        <p>
          Results are released by the Writing Centre. They are not shown in the portal the
          moment you finish.
        </p>
      </Section>

      <Section title="If something goes wrong">
        <p>
          If a machine fails, if you are moved mid-sitting, or if you think a section was
          submitted in error, tell an invigilator in the room and write to{' '}
          <a
            href="mailto:thewritingcentre@alueducation.com"
            className="text-ftm-crimson underline underline-offset-4 hover:text-ftm-crimsondeep transition-colors"
          >
            thewritingcentre@alueducation.com
          </a>{' '}
          the same day. Include your EPT ID and the date of the sitting.
        </p>
      </Section>
    </LegalPage>
  );
}
