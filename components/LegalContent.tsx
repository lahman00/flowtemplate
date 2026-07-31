import type { ReactNode } from "react";

export function LegalContent({
  sections,
}: {
  sections: Array<{ heading: string; body: ReactNode }>;
}) {
  return (
    <div className="mt-10 space-y-10">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
          <div className="mt-3 space-y-3 leading-7 text-zinc-400">{section.body}</div>
        </section>
      ))}
    </div>
  );
}
