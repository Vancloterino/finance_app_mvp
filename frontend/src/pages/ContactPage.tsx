import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HelpCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { api } from '../api/client';

const ContactPage: React.FC = () => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
    company: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    else if (formData.message.length < 10) newErrors.message = 'Message must be at least 10 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/contact/submit', formData);
      setTicketId(response.data.ticket_id);
      toast.success(`Message sent successfully! Ticket #${response.data.ticket_id}`);
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        phone: '',
        company: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact & Support</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help! Get in touch with our support team or find answers to your questions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Information Cards */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-[#E8F4FD] p-3 rounded-lg">
                <Mail className="h-6 w-6 text-[#0070BA]" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Email Us</h3>
            </div>
            <p className="text-gray-600 mb-2">For general inquiries:</p>
            <a href="mailto:support@financeapp.com" className="text-[#0070BA] hover:underline font-medium">
              support@financeapp.com
            </a>
            <p className="text-gray-600 mt-4 mb-2">For technical support:</p>
            <a href="mailto:tech@financeapp.com" className="text-[#0070BA] hover:underline font-medium">
              tech@financeapp.com
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-[#E8F4FD] p-3 rounded-lg">
                <Phone className="h-6 w-6 text-[#0070BA]" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Call Us</h3>
            </div>
            <p className="text-gray-600 mb-2">Toll-free support line:</p>
            <a href="tel:+14155550123" className="text-[#0070BA] hover:underline font-medium text-lg">
              +1 (415) 555-0123
            </a>
            <p className="text-gray-500 text-sm mt-4">
              Monday - Friday: 9AM - 6PM PST<br/>
              Saturday: 10AM - 4PM PST<br/>
              Sunday: Closed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-[#E8F4FD] p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-[#0070BA]" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Visit Us</h3>
            </div>
            <p className="text-gray-600 mb-2">FinanceApp Inc.</p>
            <p className="text-gray-700">
              123 Main Street<br/>
              Suite 100<br/>
              San Francisco, CA 94105<br/>
              United States
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Office hours: Mon-Fri, 9AM-5PM PST
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <MessageCircle className="h-6 w-6 text-[#0070BA] mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Send Us a Message</h2>
            </div>

            {ticketId && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ Message sent successfully!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Your ticket number is: <strong>#{ticketId}</strong>
                </p>
                <p className="text-green-600 text-sm mt-2">
                  We'll respond within 24 hours.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  error={errors.name}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  error={errors.email}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone (optional)"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />

                <Input
                  label="Company (optional)"
                  type="text"
                  placeholder="Acme Corp"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>

              <Input
                label="Subject"
                type="text"
                placeholder="How can we help you?"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                error={errors.subject}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Please describe your issue or question in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070BA] ${
                    errors.message ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.message && (
                  <p className="text-red-600 text-sm mt-1">{errors.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="w-full bg-[#0070BA] hover:bg-[#005a94] text-white"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* FAQ and Additional Resources */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <HelpCircle className="h-6 w-6 text-[#0070BA] mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Quick Help</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Find answers to common questions about spaces, pledges, and payouts.
                  </p>
                  <a href="/help" className="text-[#0070BA] hover:underline text-sm font-medium">
                    Browse FAQ →
                  </a>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <Clock className="h-4 w-4 mr-2 text-green-600" />
                    Average response: <strong className="ml-1">2-4 hours</strong>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Priority support for urgent issues
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Common Topics</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• How to create a shared space</li>
                    <li>• Adding and removing payment methods</li>
                    <li>• Understanding payout consent</li>
                    <li>• Managing space members</li>
                    <li>• Tracking transaction history</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enterprise Support */}
            <div className="bg-gradient-to-br from-[#0070BA] to-[#005a94] rounded-lg shadow-sm p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Enterprise Support</h2>
              <p className="text-blue-100 text-sm mb-4">
                Need dedicated support for your organization? We offer priority assistance, custom onboarding, and direct access to our team.
              </p>
              <a
                href="mailto:enterprise@financeapp.com"
                className="inline-block bg-white text-[#0070BA] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Contact Enterprise Sales
              </a>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Support Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium text-gray-900">9:00 AM - 6:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium text-gray-900">10:00 AM - 4:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium text-gray-900">Closed</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    For urgent issues outside business hours, please email support@financeapp.com and mark your message as "URGENT". We monitor critical issues 24/7.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#E8F4FD] to-white rounded-lg p-8 border border-[#0070BA]/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you get the most out of FinanceApp. We typically respond to all inquiries within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/help"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#0070BA] border-2 border-[#0070BA] rounded-lg font-medium hover:bg-[#E8F4FD] transition-colors"
              >
                Visit Help Center
              </a>
              <a
                href="mailto:support@financeapp.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#0070BA] text-white rounded-lg font-medium hover:bg-[#005a94] transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
