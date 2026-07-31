export type Alternative = {
  name: string;
  slug: string;
  description: string;
  bestFor: string;
  strengths: string[];
};

export type Software = {
  name: string;
  slug: string;
  category: string;
  description: string;
  alternatives: Alternative[];
};

export const softwareData: Record<string, Software> = {
  notion: {
    name: "Notion",
    slug: "notion",
    category: "Workspace and productivity",
    description:
      "Notion combines documents, databases, project tracking, and team knowledge in one flexible workspace.",
    alternatives: [
      {
        name: "ClickUp",
        slug: "clickup",
        description:
          "A project-management platform with tasks, dashboards, documents, and workflow automation.",
        bestFor: "Teams that need structured project management",
        strengths: ["Task management", "Dashboards", "Automation"],
      },
      {
        name: "Coda",
        slug: "coda",
        description:
          "A collaborative document platform that combines text, tables, formulas, and app-like workflows.",
        bestFor: "Teams building custom internal workflows",
        strengths: ["Flexible documents", "Formulas", "Integrations"],
      },
      {
        name: "Confluence",
        slug: "confluence",
        description:
          "A team knowledge-management platform designed for documentation and internal collaboration.",
        bestFor: "Larger teams managing structured documentation",
        strengths: ["Knowledge base", "Permissions", "Atlassian integration"],
      },
    ],
  },

  slack: {
    name: "Slack",
    slug: "slack",
    category: "Team communication",
    description:
      "Slack is a workplace communication platform built around channels, direct messages, integrations, and searchable conversations.",
    alternatives: [
      {
        name: "Microsoft Teams",
        slug: "microsoft-teams",
        description:
          "A communication and collaboration platform with chat, meetings, file sharing, and Microsoft 365 integration.",
        bestFor: "Organizations already using Microsoft 365",
        strengths: ["Video meetings", "Office integration", "File collaboration"],
      },
      {
        name: "Discord",
        slug: "discord",
        description:
          "A community-focused communication platform with text channels, voice rooms, and real-time collaboration.",
        bestFor: "Communities and informal teams",
        strengths: ["Voice channels", "Community tools", "Easy onboarding"],
      },
      {
        name: "Mattermost",
        slug: "mattermost",
        description:
          "A team messaging platform designed for organizations that need greater control over hosting and security.",
        bestFor: "Technical teams needing self-hosting",
        strengths: ["Self-hosting", "Security control", "Developer workflows"],
      },
    ],
  },

  clickup: {
    name: "ClickUp",
    slug: "clickup",
    category: "Project management",
    description:
      "ClickUp is a project-management platform that combines tasks, documents, dashboards, goals, and automation.",
    alternatives: [
      {
        name: "Asana",
        slug: "asana",
        description:
          "A work-management platform focused on projects, tasks, timelines, and team coordination.",
        bestFor: "Teams wanting clear and structured project tracking",
        strengths: ["Timelines", "Task dependencies", "Team workflows"],
      },
      {
        name: "Monday.com",
        slug: "monday",
        description:
          "A visual work-management platform with customizable boards, dashboards, and automations.",
        bestFor: "Teams that prefer visual workflow management",
        strengths: ["Custom boards", "Dashboards", "Automation"],
      },
      {
        name: "Trello",
        slug: "trello",
        description:
          "A simple visual project-management tool based on boards, lists, and cards.",
        bestFor: "Small teams needing a simple workflow",
        strengths: ["Easy setup", "Kanban boards", "Low learning curve"],
      },
    ],
  },

  trello: {
    name: "Trello",
    slug: "trello",
    category: "Visual project management",
    description:
      "Trello organizes projects with boards, lists, and cards, making it easy to visualize work in progress.",
    alternatives: [
      {
        name: "Asana",
        slug: "asana",
        description:
          "A structured project-management platform with tasks, timelines, milestones, and reporting.",
        bestFor: "Teams managing more complex projects",
        strengths: ["Project structure", "Timelines", "Reporting"],
      },
      {
        name: "ClickUp",
        slug: "clickup",
        description:
          "An all-in-one work-management platform with tasks, dashboards, documents, and automations.",
        bestFor: "Teams needing more features and customization",
        strengths: ["Customization", "Dashboards", "Automation"],
      },
      {
        name: "Notion",
        slug: "notion",
        description:
          "A flexible workspace combining documents, databases, project boards, and team knowledge.",
        bestFor: "Teams combining project tracking and documentation",
        strengths: ["Documents", "Databases", "Flexible workspaces"],
      },
    ],
  },

  asana: {
    name: "Asana",
    slug: "asana",
    category: "Work management",
    description:
      "Asana helps teams organize projects, assign tasks, manage deadlines, and track work across multiple views.",
    alternatives: [
      {
        name: "ClickUp",
        slug: "clickup",
        description:
          "A broad productivity platform combining project management, documents, dashboards, and automation.",
        bestFor: "Teams wanting an all-in-one workspace",
        strengths: ["Feature depth", "Customization", "Dashboards"],
      },
      {
        name: "Monday.com",
        slug: "monday",
        description:
          "A visual work-management platform with configurable boards and automated workflows.",
        bestFor: "Teams wanting highly visual workflows",
        strengths: ["Visual boards", "Automation", "Templates"],
      },
      {
        name: "Trello",
        slug: "trello",
        description:
          "A lightweight Kanban tool that organizes work with boards, lists, and cards.",
        bestFor: "Small teams with simple workflows",
        strengths: ["Simplicity", "Fast setup", "Kanban"],
      },
    ],
  },
};

export function getSoftware(slug: string) {
  return softwareData[slug];
}

export function getAllSoftware(): Software[] {
  return Object.values(softwareData);
}
