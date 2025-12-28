import React from 'react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using FinanceApp ("the Service"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                FinanceApp is a web-based platform that facilitates shared expense management, group pledges, and transparent payouts among members of shared spaces. The Service includes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Creation and management of shared financial spaces</li>
                <li>Recording and tracking pledges and contributions</li>
                <li>Coordinating group consent for payouts</li>
                <li>Processing payments via Stripe</li>
                <li>Transaction history and audit trails</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility</h2>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Account Registration</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To use the Service, you must create an account by providing accurate and complete information, including a valid email address and secure password.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials. You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use a strong, unique password</li>
                <li>Not share your password with others</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Take responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Account Termination</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, illegal, or abusive behavior.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Financial Transactions</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Payment Processing</h3>
              <p className="text-gray-700 mb-4">
                All payments are processed securely through Stripe, a third-party payment processor. By providing payment information, you agree to Stripe's terms of service and privacy policy.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Payment Authorization</h3>
              <p className="text-gray-700 mb-4">
                By adding a payment method, you authorize us to charge that payment method for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Pledges you create in shared spaces</li>
                <li>Your allocated share of approved payouts</li>
                <li>Any applicable fees or charges</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Refunds and Disputes</h3>
              <p className="text-gray-700 mb-4">
                Refunds are handled on a case-by-case basis. To request a refund or dispute a charge, contact support@financeapp.com within 30 days of the transaction.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.4 Fees</h3>
              <p className="text-gray-700 mb-4">
                We do not currently charge service fees for using FinanceApp. However, payment processing fees charged by Stripe may apply and will be disclosed before you complete a transaction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Conduct</h2>
              <p className="text-gray-700 mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use the Service for any illegal purpose or fraudulent activity</li>
                <li>Violate any laws, including money laundering regulations</li>
                <li>Misrepresent your identity or affiliation</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Use automated tools (bots, scrapers) without permission</li>
                <li>Upload viruses, malware, or malicious code</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Create multiple accounts to evade restrictions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are the exclusive property of FinanceApp and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 mb-4">
                You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your use of the Service is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal information. By using the Service, you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 No Warranty</h3>
              <p className="text-gray-700 mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.2 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We reserve the right to modify, suspend, or discontinue the Service at any time without notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.3 Financial Advice</h3>
              <p className="text-gray-700 mb-4">
                FinanceApp does not provide financial, legal, or tax advice. We are a tool for managing shared expenses. Consult qualified professionals for financial advice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FINANCEAPP AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-gray-700 mb-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE LAST 12 MONTHS, OR $100, WHICHEVER IS GREATER.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify, defend, and hold harmless FinanceApp and its affiliates from any claims, liabilities, damages, losses, and expenses, including legal fees, arising out of or related to your:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use or misuse of the Service</li>
                <li>Violation of these Terms</li>
                <li>Violation of any rights of another party</li>
                <li>Violation of any law or regulation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Dispute Resolution</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">12.1 Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">12.2 Arbitration</h3>
              <p className="text-gray-700 mb-4">
                Any dispute arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association (AAA), rather than in court. The arbitration shall take place in San Francisco, California.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">12.3 Class Action Waiver</h3>
              <p className="text-gray-700 mb-4">
                You agree to bring claims against us only in your individual capacity and not as part of any class or representative action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Modifications to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Termination</h2>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by contacting support@financeapp.com. Upon termination, you will lose access to the Service and your data may be deleted.
              </p>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Entire Agreement</h2>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and FinanceApp regarding the Service and supersede all prior agreements and understandings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Company Name:</strong> FinanceApp Inc.</p>
                <p className="text-gray-700 mb-2"><strong>Legal Email:</strong> legal@financeapp.com</p>
                <p className="text-gray-700 mb-2"><strong>Support:</strong> support@financeapp.com</p>
                <p className="text-gray-700 mb-2"><strong>Phone:</strong> +1 (415) 555-0123</p>
                <p className="text-gray-700"><strong>Address:</strong> FinanceApp Inc., 123 Main Street, Suite 100, San Francisco, CA 94105, United States</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              By using FinanceApp, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
