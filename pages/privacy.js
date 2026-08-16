// pages/privacy.js
//
// Written from what the code actually does, not from a template. Every claim
// on this page traces to a specific place in the repo:
//   - the event list          → context/ProctoringContext.js
//   - the 15-second sampling  → TYPING_SAMPLE_GAP_MS in the same file
//   - the 50-event cap        → getProctoringData()
//   - the three-strike rule   → shouldForceSubmit()
//   - where it is stored      → utils/sheetSchema.js, Submissions column K
// If the proctoring code changes, this page changes with it.
//
// NOTE FOR THE TEAM: this is an accurate description of system behaviour, not
// legal advice. Have someone at ALU read it before it is treated as policy.
import LegalPage, { Section, List } from '../components/LegalPage';

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Futurimi · English Proficiency Test"
      title="What the exam records about you"
      standfirst="Futurimi is a proctored exam. While a section is open, the portal watches for a small set of specific events. This page lists all of them, because you should not have to guess."
      updated="16 August 2026"
    >
      <Section title="What we hold before the exam">
        <p>
          Your name, your student email address and your EPT ID come from your ALU
          registration. When you book a sitting we also store the date you chose and
          whether you are bringing your own laptop.
        </p>
      </Section>

      <Section title="What the portal records during a sitting">
        <p>
          Recording starts when you begin a section and stops when you submit it. Each
          event is stored as a type and a timestamp:
        </p>
        <List
          items={[
            'Leaving fullscreen.',
            'Switching away from the exam tab or window, and switching back. The gap between the two is kept as away time.',
            'Attempts to copy, cut or paste. These are blocked as well as recorded.',
            'Right-clicks, and the shortcuts Ctrl/Cmd+C, V, X and P, Print Screen and F12. Also blocked as well as recorded.',
            'A guess at whether a second screen is attached, made from your window and screen width. It is a heuristic and it is wrong often enough that staff are told to treat it as a question, not a finding.',
            'During the writing section only: your running word count, sampled at most once every 15 seconds. This records how fast the essay grew, never what it says.',
          ]}
        />
        <p>
          The last 50 events of a sitting are submitted, along with up to 120 word-count
          samples.
        </p>
      </Section>

      <Section title="What the portal does not record">
        <p>
          There is no camera, no microphone and no screen recording. Nothing is captured
          from any other window or application. Your keystrokes are not logged; the
          writing section stores only the essay you submit and the word-count curve
          described above.
        </p>
      </Section>

      <Section title="What happens if an event is recorded">
        <p>
          Three fullscreen exits, three tab switches or three copy-paste attempts in one
          section will submit that section automatically. You will see a warning before
          each of them.
        </p>
        <p>
          A recorded event is a prompt for a conversation, not a verdict. Staff reviewing
          a sitting see the events and are expected to ask you about them before drawing
          any conclusion.
        </p>
      </Section>

      <Section title="Where it goes and who sees it">
        <p>
          Your answers, your marks and your proctoring events are stored in the Writing
          Centre&rsquo;s Google Sheets workbook. Writing Centre staff with an admin account
          can see them. Nothing is sold, shared with advertisers, or sent to any third
          party beyond Google, who host the storage.
        </p>
        <p>
          Essays submitted for the writing section are sent to Cerebras for marking by a
          language model. The essay text goes; your name, email and EPT ID do not.
        </p>
      </Section>

      <Section title="Asking us about your data">
        <p>
          To see what is held about you, to correct it, or to ask why a sitting was
          flagged, write to{' '}
          <a
            href="mailto:thewritingcentre@alueducation.com"
            className="text-ftm-crimson underline underline-offset-4 hover:text-ftm-crimsondeep transition-colors"
          >
            thewritingcentre@alueducation.com
          </a>
          . Say which sitting you are asking about.
        </p>
      </Section>
    </LegalPage>
  );
}
