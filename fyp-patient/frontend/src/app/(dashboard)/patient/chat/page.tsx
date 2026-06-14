import { redirect } from "next/navigation";

// Chat is now a popup widget available on every dashboard page.
// Redirect old bookmarks to dashboard and auto-open the widget.
export default function ChatPage() {
  redirect("/patient/dashboard?chat=open");
}
