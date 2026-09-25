import type { Metadata } from "next";
import { ContactView } from "./contact-view";

export const metadata: Metadata = {
  title: "Contact us — Kireeye",
  description: "Questions about renting or listing a property? Get in touch with the Kireeye team.",
};

export default function ContactPage() {
  return <ContactView />;
}
