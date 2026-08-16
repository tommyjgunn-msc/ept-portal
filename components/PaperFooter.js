// components/PaperFooter.js — the footer that carries the two pages the portal
// was missing entirely: what candidates agree to, and what the exam records
// about them. This one matters more than most: Futurimi monitors tab switches,
// copy-paste, fullscreen exits and typing cadence during a sitting, and until
// now nothing on the site said so.
//
// `tone` picks the ground: 'paper' for the light pages, 'night' for the dark
// dashboard. There is no third option.
import Link from 'next/link';

const SUPPORT_EMAIL = 'thewritingcentre@alueducation.com';

export default function PaperFooter({ tone = 'paper' }) {
  const paper = tone === 'paper';
  const wrap = paper
    ? 'border-t border-ftm-linel text-ftm-mutl'
    : 'border-t border-ftm-line text-ftm-dim';
  const link = paper
    ? 'text-ftm-bodyl hover:text-ftm-panel'
    : 'text-ftm-mut hover:text-ftm-ink';

  return (
    <footer className={`w-full ${wrap}`}>
      <div className="max-w-shell mx-auto px-6 sm:px-10 py-6 flex flex-wrap items-center gap-x-8 gap-y-2">
        <p className="font-inter text-[13px] mr-auto">
          African Leadership University, Kigali
        </p>
        <Link href="/privacy" className={`font-inter text-[13px] underline underline-offset-4 transition-colors ${link}`}>
          What the exam records
        </Link>
        <Link href="/terms" className={`font-inter text-[13px] underline underline-offset-4 transition-colors ${link}`}>
          Exam rules
        </Link>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className={`font-inter text-[13px] underline underline-offset-4 transition-colors ${link}`}
        >
          Contact
        </a>
      </div>
    </footer>
  );
}
