/**
 * Resolve the post-authentication destination for a patient.
 * Handles both guest-originated logins (redirect=doctors) and
 * direct signups where specialty may still be provided.
 */
export function resolvePostAuthPath(params: URLSearchParams): string {
  const redirect = params.get("redirect");
  const specialty = params.get("specialty");
  const guestSessionId = params.get("guestSessionId");

  // Any combination of redirect=doctors OR guestSessionId lands on doctors page
  if (redirect === "doctors" || guestSessionId) {
    const q = new URLSearchParams({ nearby: "1" });
    if (specialty) q.set("specialty", specialty);
    return `/patient/doctors?${q.toString()}`;
  }
  return "/patient/dashboard";
}
