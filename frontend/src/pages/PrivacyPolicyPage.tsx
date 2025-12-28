import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to FinanceApp ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We collect personal information that you voluntarily provide to us when you register for an account, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Name</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Phone number (optional)</li>
                <li>Profile photo (optional)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Financial Information</h3>
              <p className="text-gray-700 mb-4">
                We collect financial information necessary to process payments and manage shared expenses:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Payment method details (processed securely via Stripe)</li>
                <li>Transaction history</li>
                <li>Pledge and payout information</li>
                <li>Bank account details for payouts (encrypted)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Usage Data</h3>
              <p className="text-gray-700 mb-4">
                We automatically collect certain information about your device and usage:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and features used</li>
                <li>Time and date of visits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Create and manage your account</li>
                <li>Process payments and transactions</li>
                <li>Facilitate shared expense management</li>
                <li>Send notifications about pledges, payouts, and account activity</li>
                <li>Provide customer support</li>
                <li>Improve our services and develop new features</li>
                <li>Detect and prevent fraud or unauthorized activity</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Encryption of sensitive data at rest and in transit (HTTPS/TLS)</li>
                <li>Secure password hashing using bcrypt</li>
                <li>Field-level encryption for bank account details</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>PCI-DSS compliant payment processing via Stripe</li>
              </ul>
              <p className="text-gray-700">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 With Other Users</h3>
              <p className="text-gray-700 mb-4">
                When you participate in a shared space, other members can see your name, profile photo, pledges, and consent decisions.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 With Service Providers</h3>
              <p className="text-gray-700 mb-4">We share information with trusted third-party service providers:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Stripe:</strong> For payment processing</li>
                <li><strong>Email Service Providers:</strong> For transactional emails</li>
                <li><strong>Cloud Hosting:</strong> For data storage and application hosting</li>
                <li><strong>Analytics Providers:</strong> For usage analytics (if applicable)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide our services</li>
                <li>Comply with legal obligations (e.g., tax, accounting)</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p className="text-gray-700">
                Financial transaction records are retained for at least 7 years to comply with legal requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Request a portable copy of your data</li>
                <li><strong>Objection:</strong> Object to processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of data processing</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, please contact us at privacy@financeapp.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use essential cookies to maintain your session and remember your preferences. We do not use third-party advertising cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for users under the age of 18. We do not knowingly collect information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the application. Your continued use of our services after changes are posted constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@financeapp.com</p>
                <p className="text-gray-700 mb-2"><strong>Support:</strong> support@financeapp.com</p>
                <p className="text-gray-700 mb-2"><strong>Data Protection Officer:</strong> dpo@financeapp.com</p>
                <p className="text-gray-700"><strong>Address:</strong> FinanceApp Inc., 123 Main Street, Suite 100, San Francisco, CA 94105, United States</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              By using FinanceApp, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
