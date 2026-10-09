/**
 * Current year for the footer. Cache Components forbids `new Date()` during
 * prerender, so the value is cached ("use cache"): the page stays static and
 * the year refreshes on redeploy or cache revalidation.
 */
export async function CopyrightYear() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}
