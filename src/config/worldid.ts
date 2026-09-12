// Public World ID configuration. The app_id is public by design; the RP id and
// its signing key are server-only secrets and never appear in this file.
export const WORLDID_CONFIG = {
  appId: "app_b54b380043842fef8b8c88c8e3bcdc5d" as `app_${string}`,
  /** Registered in the Developer Portal under Actions. Must match byte for byte. */
  action: "budget-release",
  credential: "Selfie Check",
  /** What the credential is, and is not, used for. Rendered verbatim in the UI. */
  purpose:
    "A low-friction, low-assurance human credential used as an authorisation and abuse-prevention signal for releasing a pathway budget.",
} as const;
