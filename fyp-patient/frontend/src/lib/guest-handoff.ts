/**
 * Shared utility for resolving the post-authentication redirect path
 * when a patient arrives from the guest chat flow.
 */
export function resolvePostAuthPath(params: URLSearchParams): string {
  const redirect = params.get("redirect");
  const specialty = params.get("specialty");

  if (redirect === "doctors") {
    const q = new URLSearchParams({ nearby: "1" });
    if (specialty) q.set("specialty", specialty);
    return `/patient/doctors?${q.toString()}`;
  }
  return "/patient/dashboard";
}
