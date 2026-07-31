export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

export const SITE_NAME = "Flowtemplate";

export const SITE_DESCRIPTION =
  "Compare software alternatives, pricing, features, and migration options in one place — so you can switch with confidence.";

export const CONTACT_EMAIL = "hello@flowtemplate.app";
