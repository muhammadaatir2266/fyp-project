import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | DocLink",
  description:
    "How DocLink collects, uses, protects, and shares your personal and health information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="June 28, 2026"
      intro="Your privacy matters to us. This policy explains what information DocLink collects, how we use it, and the choices you have."
    >
      <LegalSection heading="1. Introduction">
        <p>
          DocLink (&ldquo;DocLink&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;) provides an AI-assisted health platform that helps
          patients understand their symptoms, find suitable doctors, and book
          appointments. This Privacy Policy applies to our website,
          applications, and related services (collectively, the
          &ldquo;Service&rdquo;). By using the Service, you agree to the
          practices described here.
        </p>
      </LegalSection>

      <LegalSection heading="2. Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account information:</strong> name, email address, password,
            phone number, gender, and role (patient or doctor).
          </li>
          <li>
            <strong>Health information:</strong> symptoms you describe, chat
            messages, and AI-generated predictions or recommendations. This may
            include sensitive health data that you choose to share.
          </li>
          <li>
            <strong>Doctor profile information:</strong> for doctors, this
            includes specialty, qualifications, experience, clinic address,
            consultation fees, availability, and verification documents such as
            a medical license.
          </li>
          <li>
            <strong>Location information:</strong> your city or approximate GPS
            location, used only to recommend nearby doctors.
          </li>
          <li>
            <strong>Appointment information:</strong> bookings, scheduling, and
            related communications between patients and doctors.
          </li>
          <li>
            <strong>Google Calendar data (doctors only):</strong> if a doctor
            connects their Google Calendar, we access free/busy availability and
            create calendar events for confirmed appointments (see Section 6).
          </li>
          <li>
            <strong>Technical information:</strong> device, browser, and usage
            data collected automatically to operate and secure the Service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. How We Use Your Information">
        <ul className="list-disc space-y-2 pl-6">
          <li>To provide AI-based symptom analysis and doctor recommendations.</li>
          <li>To match patients with relevant, nearby healthcare providers.</li>
          <li>To enable appointment booking, scheduling, and voice-assisted calls.</li>
          <li>To verify doctor credentials and maintain platform trust and safety.</li>
          <li>To operate, maintain, secure, and improve the Service.</li>
          <li>To communicate with you about your account, bookings, and support requests.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. How We Share Information">
        <p>We do not sell your personal information. We share information only:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>With doctors</strong> you choose to book or interact with, so
            they can provide care.
          </li>
          <li>
            <strong>With service providers</strong> who help us operate the
            Service (for example, cloud hosting, database, file storage, AI
            processing, and voice-call providers), under appropriate
            confidentiality obligations.
          </li>
          <li>
            <strong>For legal reasons</strong>, when required by law or to
            protect the rights, safety, and security of users and the public.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Third-Party Services">
        <p>
          The Service integrates third-party providers to deliver core features,
          including AI/automation services, mapping and geocoding to find nearby
          doctors, voice-call infrastructure, and cloud storage. These providers
          process data only as needed to perform their functions on our behalf.
        </p>
      </LegalSection>

      <LegalSection heading="6. Google Calendar Integration & Google API Limited Use">
        <p>
          Doctors may optionally connect a Google account to sync availability.
          When connected, we request access to Google Calendar in order to read
          free/busy times (so we never book over an existing event) and to create
          or update calendar events for appointments booked through DocLink.
        </p>
        <p>
          DocLink&rsquo;s use and transfer of information received from Google
          APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. We only use Google Calendar
          data to provide and improve the availability and booking features, we
          do not transfer or sell this data, and we do not use it for advertising.
          You can disconnect Google Calendar at any time from your availability
          settings, which revokes our access and removes the stored connection.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data Security">
        <p>
          We use industry-standard safeguards to protect your information,
          including encryption in transit, encryption of sensitive credentials
          (such as Google refresh tokens) at rest, access controls, and secure
          infrastructure. No method of transmission or storage is completely
          secure, but we work continuously to protect your data.
        </p>
      </LegalSection>

      <LegalSection heading="8. Data Retention">
        <p>
          We retain your information for as long as your account is active or as
          needed to provide the Service, comply with legal obligations, resolve
          disputes, and enforce our agreements. You may request deletion of your
          account and associated personal data as described below.
        </p>
      </LegalSection>

      <LegalSection heading="9. Your Rights and Choices">
        <ul className="list-disc space-y-2 pl-6">
          <li>Access, update, or correct your account information.</li>
          <li>Disconnect optional integrations such as Google Calendar.</li>
          <li>Request deletion of your account and personal data.</li>
          <li>Opt out of non-essential communications.</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a
            href="mailto:support@doclink.dev"
            className="font-medium text-primary hover:underline"
          >
            support@doclink.dev
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="10. Medical Disclaimer">
        <p>
          DocLink provides informational AI-driven insights and doctor
          recommendations. It does not provide medical diagnosis or treatment and
          is not a substitute for professional medical advice. Always consult a
          qualified healthcare provider regarding any medical condition.
        </p>
      </LegalSection>

      <LegalSection heading="11. Children&rsquo;s Privacy">
        <p>
          The Service is not directed to children under 16, and we do not
          knowingly collect personal information from them. If you believe a
          child has provided us information, please contact us so we can remove it.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. When we make
          material changes, we will update the &ldquo;Last updated&rdquo; date
          above and, where appropriate, provide additional notice.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
