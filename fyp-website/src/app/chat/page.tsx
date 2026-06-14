import { redirect } from "next/navigation";

// Guest chat is now a floating popup widget on every page.
// Redirect old /chat links to the homepage where the widget is available.
export default function ChatPage() {
  redirect("/");
}
