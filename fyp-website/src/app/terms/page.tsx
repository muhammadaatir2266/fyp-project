import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service | DocLink",
  description:
    "The terms and conditions governing your use of the DocLink platform.",
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="June 28, 2026"
      intro="Please read these terms carefully. They govern your access to and use of the DocLink platform."
    >
      <LegalSection heading="1. Acceptance of Terms">
        <p>
          By accessing or using DocLink (the &ldquo;Service&rdquo;), you agree to
          be bound by these Terms of Service and our Privacy Policy. If you do not
          agree, please do not use the Service.
        </p>
      </LegalSection>

      <LegalSection heading="2. Description of the Service">
        <p>
          DocLink is an AI-assisted health platform that helps patients
          understand symptoms, discover suitable doctors, and book appointments,
          including via in-app and AI voice-assisted booking. Doctors can manage
          their profiles, availability, and appointments.
        </p>
      </LegalSection>

      <LegalSection heading="3. Medical Disclaimer">
        <p>
          DocLink does not provide medical advice, diagnosis, or treatment. AI
          predictions and recommendations are informational only and are not a
          substitute for professional medical judgment. Always seek the advice of
          a qualified healthcare provider with any questions about a medical
          condition. In an emergency, contact your local emergency services
          immediately.
        </p>
      </LegalSection>

      <LegalSection heading="4. Eligibility and Accounts">
        <ul className="list-disc space-y-2 pl-6">
          <li>You must be at least 16 years old to use the Service.</li>
          <li>
            You are responsible for providing accurate information and for
            maintaining the confidentiality of your account credentials.
          </li>
          <li>
            You are responsible for all activity that occurs under your account.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Doctor Responsibilities">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Doctors must provide accurate professional credentials and maintain
            valid licensure. Profiles are subject to verification.
          </li>
          <li>
            Doctors are solely responsible for the care they provide and for
            complying with applicable laws and professional standards.
          </li>
          <li>
            Doctors are responsible for keeping their availability accurate,
            including any connected calendar.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Appointments, Bookings, and Cancellations">
        <p>
          DocLink facilitates scheduling between patients and doctors but is not a
          party to the patient-doctor relationship. Appointment confirmation,
          rescheduling, and cancellation are subject to doctor availability and
          policies. We are not responsible for missed, delayed, or cancelled
          appointments.
        </p>
      </LegalSection>

      <LegalSection heading="7. AI and Recommendations">
        <p>
          AI-generated symptom analysis and doctor recommendations may be
          incomplete or inaccurate and should be used as supportive information
          only. You acknowledge the inherent limitations of AI and agree to use
          professional judgment when making health decisions.
        </p>
      </LegalSection>

      <LegalSection heading="8. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Use the Service for any unlawful or harmful purpose.</li>
          <li>Provide false information or impersonate any person or entity.</li>
          <li>Attempt to gain unauthorized access to the Service or other accounts.</li>
          <li>Interfere with, disrupt, or overload the Service or its infrastructure.</li>
          <li>Misuse, scrape, or resell data obtained through the Service.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="9. Third-Party Services">
        <p>
          The Service integrates third-party providers (such as AI/automation,
          mapping, voice-call, cloud storage, and calendar services). Your use of
          those features may be subject to the third parties&rsquo; own terms and
          policies. We are not responsible for third-party services.
        </p>
      </LegalSection>

      <LegalSection heading="10. Intellectual Property">
        <p>
          The Service, including its software, design, and content (excluding
          user-provided content), is owned by DocLink and protected by applicable
          intellectual property laws. You may not copy, modify, or distribute it
          without permission.
        </p>
      </LegalSection>

      <LegalSection heading="11. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, DocLink and its affiliates are
          not liable for any indirect, incidental, special, consequential, or
          punitive damages, or any loss arising from your use of (or inability to
          use) the Service, including reliance on AI outputs or interactions with
          doctors. The Service is provided &ldquo;as is&rdquo; without warranties
          of any kind.
        </p>
      </LegalSection>

      <LegalSection heading="12. Termination">
        <p>
          We may suspend or terminate your access to the Service at any time for
          conduct that violates these Terms or is otherwise harmful. You may stop
          using the Service and request account deletion at any time.
        </p>
      </LegalSection>

      <LegalSection heading="13. Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we make material
          changes, we will update the &ldquo;Last updated&rdquo; date above.
          Continued use of the Service after changes take effect constitutes
          acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection heading="14. Governing Law">
        <p>
          These Terms are governed by the laws of the jurisdiction in which
          DocLink operates, without regard to conflict-of-law principles.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
