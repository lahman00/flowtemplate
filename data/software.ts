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

  coda: {
    name: "Coda",
    slug: "coda",
    category: "Docs and workflow automation",
    description:
      "Coda combines documents, spreadsheet-style tables, and app-like building blocks into a single collaborative surface for teams.",
    alternatives: [
      {
        name: "Notion",
        slug: "notion",
        description:
          "A flexible workspace combining documents, databases, project boards, and team knowledge.",
        bestFor: "Teams that want a simpler, more visual all-in-one workspace",
        strengths: ["Flexible pages", "Databases", "Templates"],
      },
      {
        name: "ClickUp",
        slug: "clickup",
        description:
          "A project-management platform with tasks, dashboards, documents, and workflow automation.",
        bestFor: "Teams that need more structured project tracking alongside docs",
        strengths: ["Task management", "Dashboards", "Automation"],
      },
      {
        name: "Confluence",
        slug: "confluence",
        description:
          "A team knowledge-management platform designed for documentation and internal collaboration.",
        bestFor: "Larger teams standardizing on structured documentation",
        strengths: ["Knowledge base", "Permissions", "Atlassian integration"],
      },
    ],
  },

  confluence: {
    name: "Confluence",
    slug: "confluence",
    category: "Team knowledge and documentation",
    description:
      "Confluence is Atlassian's team workspace for documentation, meeting notes, and internal knowledge shared across an organization.",
    alternatives: [
      {
        name: "Notion",
        slug: "notion",
        description:
          "A flexible workspace combining documents, databases, project boards, and team knowledge.",
        bestFor: "Smaller teams wanting a lighter-weight, faster setup",
        strengths: ["Flexible pages", "Databases", "Templates"],
      },
      {
        name: "Coda",
        slug: "coda",
        description:
          "A collaborative document platform that combines text, tables, formulas, and app-like workflows.",
        bestFor: "Teams building custom internal tools on top of docs",
        strengths: ["Flexible documents", "Formulas", "Integrations"],
      },
      {
        name: "ClickUp",
        slug: "clickup",
        description:
          "A project-management platform with tasks, dashboards, documents, and workflow automation.",
        bestFor: "Teams that want documentation and project tracking in one place",
        strengths: ["Task management", "Dashboards", "Automation"],
      },
    ],
  },

  "microsoft-teams": {
    name: "Microsoft Teams",
    slug: "microsoft-teams",
    category: "Team communication",
    description:
      "Microsoft Teams combines chat, video meetings, and file collaboration, tightly integrated with Microsoft 365.",
    alternatives: [
      {
        name: "Slack",
        slug: "slack",
        description:
          "A workplace communication platform built around channels, direct messages, integrations, and searchable conversations.",
        bestFor: "Teams that want a lighter, integration-friendly chat tool",
        strengths: ["Channels", "App integrations", "Searchable history"],
      },
      {
        name: "Discord",
        slug: "discord",
        description:
          "A community-focused communication platform with text channels, voice rooms, and real-time collaboration.",
        bestFor: "Informal teams and communities that value voice chat",
        strengths: ["Voice channels", "Community tools", "Easy onboarding"],
      },
      {
        name: "Mattermost",
        slug: "mattermost",
        description:
          "A team messaging platform designed for organizations that need greater control over hosting and security.",
        bestFor: "Technical teams that need self-hosted, secure messaging",
        strengths: ["Self-hosting", "Security control", "Developer workflows"],
      },
    ],
  },

  discord: {
    name: "Discord",
    slug: "discord",
    category: "Community and team chat",
    description:
      "Discord organizes communities and teams around text channels, voice rooms, and real-time conversation.",
    alternatives: [
      {
        name: "Slack",
        slug: "slack",
        description:
          "A workplace communication platform built around channels, direct messages, integrations, and searchable conversations.",
        bestFor: "Professional teams that need structured, searchable channels",
        strengths: ["Channels", "App integrations", "Searchable history"],
      },
      {
        name: "Microsoft Teams",
        slug: "microsoft-teams",
        description:
          "A communication and collaboration platform with chat, meetings, file sharing, and Microsoft 365 integration.",
        bestFor: "Organizations already using Microsoft 365",
        strengths: ["Video meetings", "Office integration", "File collaboration"],
      },
      {
        name: "Mattermost",
        slug: "mattermost",
        description:
          "A team messaging platform designed for organizations that need greater control over hosting and security.",
        bestFor: "Communities that want to self-host their chat platform",
        strengths: ["Self-hosting", "Security control", "Developer workflows"],
      },
    ],
  },

  mattermost: {
    name: "Mattermost",
    slug: "mattermost",
    category: "Self-hosted team messaging",
    description:
      "Mattermost is an open-source team messaging platform built for organizations that want to host and control their own chat infrastructure.",
    alternatives: [
      {
        name: "Slack",
        slug: "slack",
        description:
          "A workplace communication platform built around channels, direct messages, integrations, and searchable conversations.",
        bestFor: "Teams that prefer a fully managed, cloud-hosted chat tool",
        strengths: ["Channels", "App integrations", "Searchable history"],
      },
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
        bestFor: "Communities that value voice chat over self-hosting",
        strengths: ["Voice channels", "Community tools", "Easy onboarding"],
      },
    ],
  },

  monday: {
    name: "Monday.com",
    slug: "monday",
    category: "Visual work management",
    description:
      "Monday.com is a visual work-management platform built around customizable boards, dashboards, and automations.",
    alternatives: [
      {
        name: "Asana",
        slug: "asana",
        description:
          "A work-management platform focused on projects, tasks, timelines, and team coordination.",
        bestFor: "Teams that want a more structured, list-first workflow",
        strengths: ["Timelines", "Task dependencies", "Team workflows"],
      },
      {
        name: "ClickUp",
        slug: "clickup",
        description:
          "A project-management platform with tasks, dashboards, documents, and workflow automation.",
        bestFor: "Teams that want more customization and an all-in-one workspace",
        strengths: ["Task management", "Dashboards", "Automation"],
      },
      {
        name: "Trello",
        slug: "trello",
        description:
          "A simple visual project-management tool based on boards, lists, and cards.",
        bestFor: "Small teams that want the simplest possible board view",
        strengths: ["Easy setup", "Kanban boards", "Low learning curve"],
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
