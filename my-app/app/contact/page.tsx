import type { Metadata } from "next";
import { ContactView } from "./contact-view";

export const metadata: Metadata = {
  title: "Contact us — Stayly",
  description: "Questions about renting or listing a property? Get in touch with the Stayly team.",
};

export default function ContactPage() {
  return <ContactView />;
}
