// components/LegalPage.js — shared chrome for the two static pages the portal
// was missing. Paper ground, one column at reading measure, no cards.
import Link from 'next/link';
import { FuturimiWordmark, FuturimiRegister, AluMark } from './Futurimi';
import PaperFooter from './PaperFooter';

export function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-grotesk font-bold text-[21px] text-ftm-panel mb-3">{title}</h2>
      <div className="space-y-4 font-inter text-[16px] leading-[1.65] text-ftm-bodyl">{children}</div>
    </section>
  );
}

export function List({ items }) {
  return (
    <ul className="border-t border-ftm-linel">
      {items.map((item, i) => (
        <li key={i} className="py-3 border-b border-ftm-linel font-inter text-[16px] leading-[1.6] text-ftm-bodyl">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function LegalPage({ eyebrow, title, standfirst, updated, children }) {
  return (
    <div className="on-paper min-h-screen flex flex-col bg-ftm-paper text-ftm-panel">
      <FuturimiRegister tone="paper" tall />

      <header className="w-full max-w-shell mx-auto px-6 sm:px-10 pt-8 flex items-center justify-between">
        <Link href="/login" className="inline-flex">
          <FuturimiWordmark size={22} ink="#20262B" diamond="#C5132D" />
        </Link>
        <AluMark height={17} opacity={0.85} tone="paper" />
      </header>

      <main className="flex-1 w-full max-w-shell mx-auto px-6 sm:px-10 py-12">
        <div className="max-w-measure">
          <p className="font-inter font-bold text-[11px] tracking-[.16em] uppercase text-ftm-slatel">
            {eyebrow}
          </p>
          <h1 className="font-grotesk font-bold text-[32px] sm:text-[38px] leading-[1.08] tracking-[-.02em] text-ftm-panel mt-4 mb-4">
            {title}
          </h1>
          <p className="font-inter text-[17px] leading-relaxed text-ftm-bodyl mb-4">{standfirst}</p>
          <p className="font-inter text-[13px] text-ftm-mutl pb-8 mb-10 border-b-2 border-ftm-linel2">
            Last updated {updated}
          </p>
          {children}
        </div>
      </main>

      <PaperFooter />
    </div>
  );
}
