import type { Software } from "@/data/software";

export function getSoftwareFaqItems(software: Software): Array<{
  question: string;
  answer: string;
}> {
  const altNames = software.alternatives.map((alternative) => alternative.name);
  const altList =
    altNames.length > 1
      ? `${altNames.slice(0, -1).join(", ")} and ${altNames[altNames.length - 1]}`
      : altNames[0];

  return [
    {
      question: `What are the best alternatives to ${software.name}?`,
      answer: `Based on core features and use case fit, the strongest ${software.name} alternatives are ${altList}. See the comparison above for what each one does best.`,
    },
    {
      question: `How do I migrate from ${software.name} to a different tool?`,
      answer: `Most teams start by exporting their existing ${software.name} data, then importing it into the new tool while running both in parallel until the switch is complete.`,
    },
    {
      question: `Do ${software.name} alternatives integrate with the tools my team already uses?`,
      answer:
        "Integration support varies by tool — check each alternative's own integrations before switching workflows that depend on them.",
    },
  ];
}
