import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Book, CreditCard, Users, Shield, Settings, HelpCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqs: FAQ[] = [
    // Getting Started
    {
      category: 'Getting Started',
      question: 'How do I create a space?',
      answer: 'To create a space, log in to your account and click on the "Create Space" button on your Spaces page. Enter a name for your space (e.g., "Family Bills" or "Roommate Expenses"), add a description, and invite members by entering their email addresses. Once created, you can start adding pledges and managing shared expenses.',
    },
    {
      category: 'Getting Started',
      question: 'What is a "space" in FinanceApp?',
      answer: 'A space is a shared financial environment where you and your group can manage shared expenses together. Think of it as a virtual room where you can track who owes what, manage payment methods, and coordinate payouts. Each space is independent, so you can have multiple spaces for different purposes (e.g., one for family, one for roommates).',
    },
    {
      category: 'Getting Started',
      question: 'How do I invite people to my space?',
      answer: 'As a space owner or admin, go to your Space Settings and click on "Invite Members". Enter the email addresses of people you want to invite, and they\'ll receive an invitation link. Once they accept, they\'ll have access to the space and can participate in shared expenses.',
    },

    // Spaces Management
    {
      category: 'Spaces',
      question: 'What are the different member roles in a space?',
      answer: 'There are three roles: (1) Owner - Full control, can delete space, manage all settings; (2) Admin - Can invite/remove members, manage pledges and payouts, but cannot delete space; (3) Member - Can view space details, add pledges, and manage their own payment methods.',
    },
    {
      category: 'Spaces',
      question: 'Can I leave a space I\'m a member of?',
      answer: 'Yes, you can leave a space at any time by going to Space Settings and clicking "Leave Space". However, make sure all your outstanding pledges are fulfilled and payouts are settled before leaving. The owner cannot leave their own space - they must transfer ownership first or delete the space.',
    },
    {
      category: 'Spaces',
      question: 'How do I transfer ownership of a space?',
      answer: 'Go to Space Settings, scroll to the "Danger Zone" section, and click "Transfer Ownership". Select the member you want to transfer ownership to. This action is irreversible, so make sure you trust the new owner.',
    },
    {
      category: 'Spaces',
      question: 'Can I delete a space?',
      answer: 'Yes, but only the space owner can delete a space. Go to Space Settings, scroll to the "Danger Zone", and click "Delete Space". All members will lose access, and all data will be permanently deleted. Make sure all financial obligations are settled before deletion.',
    },

    // Payments & Payment Methods
    {
      category: 'Payments',
      question: 'How do I add a payment method?',
      answer: 'Go to your Account Settings and click on "Payment Methods". Click "Add Payment Method" and enter your credit/debit card information. We use Stripe for secure payment processing, and your card details are encrypted and never stored on our servers.',
    },
    {
      category: 'Payments',
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe integration. We also support bank accounts (ACH) for direct debits in the US. More payment methods will be added in future updates.',
    },
    {
      category: 'Payments',
      question: 'How do pledges work?',
      answer: 'A pledge is a commitment to pay a certain amount for a shared expense. When you create a pledge, you specify the amount and optionally link it to a payment method. The pledge amount is recorded in the space\'s ledger. When it\'s time to settle up, the admin initiates a payout, and funds are collected from pledgers.',
    },
    {
      category: 'Payments',
      question: 'When will my payment method be charged?',
      answer: 'Your payment method is only charged when an admin initiates a payout and you\'ve given consent for that specific payout. You\'ll receive a notification asking you to review and approve the payout before any charges occur. Adding a pledge does not automatically charge your payment method.',
    },
    {
      category: 'Payments',
      question: 'Can I modify or cancel my pledge?',
      answer: 'Yes, you can modify or cancel your pledge before it\'s been processed in a payout. Go to the space, find your pledge, and click "Edit" or "Cancel". Once a payout has been initiated and you\'ve given consent, pledges cannot be modified.',
    },
    {
      category: 'Payments',
      question: 'How do payouts work?',
      answer: 'Payouts are initiated by space admins or owners. When a payout is created, all pledgers receive a notification to review and consent. Once everyone has consented, the payout is processed, and funds are collected from pledgers and sent to the designated payee. You can track payout status in real-time.',
    },
    {
      category: 'Payments',
      question: 'What happens if someone doesn\'t give consent for a payout?',
      answer: 'If a member doesn\'t consent to a payout within the specified time frame, the admin can either wait, contact them directly, or proceed without their contribution (if space settings allow). The system tracks who has and hasn\'t consented for transparency.',
    },

    // Account & Security
    {
      category: 'Account',
      question: 'How do I change my password?',
      answer: 'Go to Account Settings, click on "Security", and select "Change Password". You\'ll need to enter your current password and then your new password twice for confirmation. We recommend using a strong, unique password.',
    },
    {
      category: 'Account',
      question: 'How do I update my profile information?',
      answer: 'Navigate to Account Settings and click on "Profile". You can update your name, email address, and profile picture. Changes to your email address will require verification.',
    },
    {
      category: 'Account',
      question: 'Can I delete my account?',
      answer: 'Yes, you can request account deletion from Account Settings > Security > Delete Account. Before deleting, make sure you\'ve left all spaces, settled all financial obligations, and removed all payment methods. Account deletion is permanent and cannot be undone.',
    },

    // Security & Privacy
    {
      category: 'Security',
      question: 'Is my payment information secure?',
      answer: 'Absolutely. We use Stripe, a PCI-DSS Level 1 certified payment processor, for all payment processing. Your credit card information is encrypted end-to-end and never stored on our servers. We also use industry-standard encryption for all sensitive data.',
    },
    {
      category: 'Security',
      question: 'How is my personal data protected?',
      answer: 'We take data protection seriously. All data is encrypted in transit (TLS) and at rest (AES-256). We follow GDPR and CCPA guidelines for data privacy. Access to your data is strictly controlled, and we never sell your information to third parties. Read our Privacy Policy for full details.',
    },
    {
      category: 'Security',
      question: 'What should I do if I suspect unauthorized access?',
      answer: 'Immediately change your password, log out from all devices (Account Settings > Security > Log Out All Sessions), and contact support at support@financeapp.com. We\'ll investigate and help secure your account.',
    },
    {
      category: 'Security',
      question: 'Do you offer two-factor authentication (2FA)?',
      answer: 'Two-factor authentication is coming soon. In the meantime, we recommend using a strong, unique password and enabling login notifications in your account settings.',
    },

    // Troubleshooting
    {
      category: 'Troubleshooting',
      question: 'Why can\'t I add a payment method?',
      answer: 'This could be due to several reasons: (1) The card information may be incorrect, (2) Your bank may be blocking the transaction, (3) The card may not be authorized for online purchases. Try a different card or contact your bank. If the issue persists, contact support.',
    },
    {
      category: 'Troubleshooting',
      question: 'I didn\'t receive an invitation email. What should I do?',
      answer: 'Check your spam/junk folder first. If it\'s not there, ask the person who invited you to resend the invitation. Make sure they used the correct email address. If you still don\'t receive it, contact support with your email address.',
    },
    {
      category: 'Troubleshooting',
      question: 'Why is my payout taking so long to process?',
      answer: 'Payout processing times depend on several factors: (1) All pledgers must give consent, (2) Bank processing times (typically 3-5 business days for ACH), (3) Stripe processing. You can check the payout status in the space dashboard. If it\'s been longer than expected, contact support.',
    },
    {
      category: 'Troubleshooting',
      question: 'I was charged but the payout shows as pending. Why?',
      answer: 'Payment collection and payout disbursement happen in stages. Your payment may be collected while the funds are being aggregated before disbursement to the payee. This is normal and ensures all funds are collected before sending. Check the payout timeline for details.',
    },

    // Billing
    {
      category: 'Billing',
      question: 'How much does FinanceApp cost?',
      answer: 'FinanceApp is free for basic use. We charge a small processing fee (2.9% + $0.30) on payouts, which is the standard Stripe fee. Enterprise plans with advanced features are available - contact enterprise@financeapp.com for details.',
    },
    {
      category: 'Billing',
      question: 'Can I get a refund?',
      answer: 'Refund eligibility depends on the specific situation. If you were charged in error, contact support@financeapp.com within 30 days with your transaction details. Refunds for completed payouts must be coordinated within your space.',
    },
    {
      category: 'Billing',
      question: 'Where can I see my transaction history?',
      answer: 'Go to Account Settings > Transaction History to see all your payments, pledges, and payouts. You can filter by date, space, and status. You can also export your history as a CSV for your records.',
    },
  ];

  const categories = [
    { name: 'all', label: 'All Topics', icon: Book },
    { name: 'Getting Started', label: 'Getting Started', icon: HelpCircle },
    { name: 'Spaces', label: 'Spaces', icon: Users },
    { name: 'Payments', label: 'Payments', icon: CreditCard },
    { name: 'Account', label: 'Account', icon: Settings },
    { name: 'Security', label: 'Security', icon: Shield },
    { name: 'Troubleshooting', label: 'Troubleshooting', icon: MessageCircle },
    { name: 'Billing', label: 'Billing', icon: CreditCard },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find answers to common questions about FinanceApp
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070BA] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-[#0070BA] text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-[#0070BA] hover:text-[#0070BA]'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any answers matching your search.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center text-[#0070BA] hover:underline font-medium"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contact Support
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="text-xs font-medium text-[#0070BA] uppercase tracking-wide">
                        {faq.category}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">
                        {faq.question}
                      </h3>
                    </div>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-4" />
                    )}
                  </button>

                  {expandedFaq === index && (
                    <div className="px-6 pb-4">
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#E8F4FD] to-white rounded-lg p-8 border border-[#0070BA]/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Still need help?
            </h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#0070BA] text-white rounded-lg font-medium hover:bg-[#005a94] transition-colors"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contact Support
              </Link>
              <a
                href="mailto:support@financeapp.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#0070BA] border-2 border-[#0070BA] rounded-lg font-medium hover:bg-[#E8F4FD] transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
