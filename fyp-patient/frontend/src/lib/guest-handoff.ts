/**
 * Resolve the post-authentication destination for a patient.
 * Guest-originated sessions (with a guestSessionId) land on the dashboard
 * with the chat open so they can continue the conversation seamlessly.
 * An explicit redirect=doctors param (e.g. from a deep link) still works.
 */
export function resolvePostAuthPath(params: URLSearchParams): string {
  const redirect = params.get("redirect");

  if (redirect === "doctors") {
    const specialty = params.get("specialty");
    const q = new URLSearchParams({ nearby: "1" });
    if (specialty) q.set("specialty", specialty);
    return `/patient/doctors?${q.toString()}`;
  }

  // Guest chat handoff → dashboard with chat auto-opened
  if (params.get("guestSessionId")) {
    return "/patient/dashboard?chat=open";
  }

  return "/patient/dashboard";
}
