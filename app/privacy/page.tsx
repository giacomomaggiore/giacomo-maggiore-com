import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Giacomo Maggiore website",
};

const lastUpdated = "19 March 2026";

export default function PrivacyPolicyPage() {
  return (
    <section>
      <h1 className="font-bold text-2xl mb-8 tracking-tighter">Privacy Policy</h1>
      <p className="text-sm text-neutral-900 dark:text-neutral-400 mb-6">
        Last updated: {lastUpdated}
      </p>

      <p className="mb-4">
        This Privacy Policy explains how personal data are processed when you use this website.
        The website owner is based in Switzerland and this policy is written to address Swiss data
        protection requirements and, where applicable, the EU General Data Protection Regulation (GDPR).
      </p>

      <h2 className="semi-title  ">1. Data Controller</h2>
      <p className="mb-2">Giacomo Maggiore</p>
      <p className="mb-4">
        Contact for privacy requests:{" "}
        <a href="mailto:giaco.maggiore@gmail.com" className="underline">
          giaco.maggiore@gmail.com
        </a>
      </p>

      <h2 className="semi-title">2. Personal Data Collected</h2>
      <ul className="list-disc ml-5 mt-2 mb-4 text-neutral-800 dark:text-neutral-200">
        <li>
          Newsletter data: email address submitted through the newsletter form.
        </li>
        <li>
          Analytics and technical usage data: pages viewed, timestamps, referrer, browser and device information,
          and IP-related information provided by analytics tools.
        </li>
        <li>
          Functional preference data: language preference cookie used for blog language selection.
        </li>
      </ul>

      <p className="mb-4">
        This website does not process payment data and does not offer paid checkout functionality.
      </p>

      <h2 className="semi-title">3. Purposes and Legal Bases</h2>
      <ul className="list-disc ml-5 mt-2 mb-4 text-neutral-800 dark:text-neutral-200">
        <li>
          Newsletter subscription and delivery: processed on the basis of consent (GDPR Article 6(1)(a)).
        </li>
        <li>
          Basic site operation, security, and anti-abuse measures (including bot protection fields): processed on the basis of legitimate interest (GDPR Article 6(1)(f)).
        </li>
        <li>
          Website analytics: processed on the basis of legitimate interest (GDPR Article 6(1)(f)).
        </li>
      </ul>

      <h2 className="semi-title">4. Cookies and Tracking</h2>
      <p className="mb-2">
        This website uses:
      </p>
      <ul className="list-disc ml-5 mt-2 mb-4 text-neutral-800 dark:text-neutral-200">
        <li>
          A functional language cookie for content language preference.
        </li>
        <li>
          Analytics technologies from Google Analytics and PostHog.
        </li>
      </ul>
      <p className="mb-4">
        No advertising or payment-related trackers are intentionally used.
      </p>

      <h2 className="semi-title">5. Newsletter Processing</h2>
      <p className="mb-4">
        Newsletter subscriptions are managed through Resend. When you subscribe, your email address is sent to Resend
        to store your contact and manage newsletter delivery. You can unsubscribe at any time using the unsubscribe link
        in newsletter emails or by contacting the email address above.
      </p>

      <h2 className="semi-title">6. Processors and Recipients</h2>
      <ul className="list-disc ml-5 mt-2 mb-4 text-neutral-800 dark:text-neutral-200">
        <li>Resend, for newsletter contact storage and email delivery.</li>
        <li>Google Analytics, for website analytics.</li>
        <li>PostHog, for website analytics.</li>
      </ul>

      <h2 className="semi-title">7. International Data Transfers</h2>
      <p className="mb-4">
        Some providers may process data outside Switzerland and/or the EEA, including in countries that may not provide
        the same level of data protection. Where required, appropriate safeguards such as Standard Contractual Clauses are used.
      </p>

      <h2 className="semi-title">8. Data Retention</h2>
      <ul className="list-disc ml-5 mt-2 mb-4 text-neutral-800 dark:text-neutral-200">
        <li>
          Newsletter email addresses are kept while you remain subscribed, unless deletion is requested.
        </li>
        <li>
          Analytics data are retained according to provider settings and internal needs for traffic analysis and service improvement.
        </li>
      </ul>

      <h2 className="semi-title">9. Your Rights</h2>
      <p className="mb-2">
        Depending on your jurisdiction (including GDPR where applicable), you may have rights to:
      </p>
      <ul className="list-disc ml-5 mt-2 mb-4 text-neutral-800 dark:text-neutral-200">
        <li>Access your personal data.</li>
        <li>Request rectification of inaccurate data.</li>
        <li>Request erasure of your data.</li>
        <li>Restrict or object to certain processing.</li>
        <li>Withdraw consent at any time for consent-based processing.</li>
        <li>Request data portability where applicable.</li>
      </ul>
      <p className="mb-4">
        You can exercise your rights by contacting{" "}
        <a href="mailto:giaco.maggiore@gmail.com" className="underline">
          giaco.maggiore@gmail.com
        </a>.
      </p>

      <h2 className="semi-title">10. Complaints</h2>
      <p className="mb-4">
        If you believe your data protection rights were violated, you may file a complaint with your local supervisory authority.
        In Switzerland, this is the FDPIC. If GDPR applies to your case, you may also contact an EU/EEA supervisory authority.
      </p>

      <h2 className="semi-title">11. Data Security</h2>
      <p className="mb-4">
        Reasonable technical and organizational measures are used to protect personal data against unauthorized access,
        misuse, disclosure, alteration, or destruction.
      </p>

      <h2 className="semi-title">12. Children</h2>
      <p className="mb-4">
        This website is not directed to children under 16, and personal data are not knowingly collected from children under 16.
      </p>

      <h2 className="semi-title">13. Changes to This Policy</h2>
      <p className="mb-4">
        This Privacy Policy may be updated from time to time. The current version is always published on this page with an updated date.
      </p>
    </section>
  );
}
