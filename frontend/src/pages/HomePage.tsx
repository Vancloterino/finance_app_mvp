import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Header from '../components/layout/Header';

const HomePage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.observe-animation');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleGetStarted = () => {
    if (state.isAuthenticated) {
      navigate('/spaces');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .observe-animation {
          opacity: 0;
        }
      `}</style>

      {/* Hero Section */}
      <section className="bg-[#0070BA] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Money for your group, made simple
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
                Split bills, track expenses, and manage shared funds with transparency and fairness.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-white text-[#0070BA] hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-lg transition-all"
                >
                  {state.isAuthenticated ? 'Go to Spaces' : 'Sign Up'}
                </Button>
                {!state.isAuthenticated && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0070BA] font-semibold px-8 py-4 text-lg transition-all"
                  >
                    Log In
                  </Button>
                )}
              </div>

              {state.isAuthenticated && state.user && (
                <div className="inline-block px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <p className="text-white font-medium">
                    Welcome back, {state.user.name}!
                  </p>
                </div>
              )}
            </div>

            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&q=80"
                alt="People collaborating"
                className="rounded-2xl shadow-2xl w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F4FD] rounded-full flex items-center justify-center text-2xl">
                🔒
              </div>
              <div>
                <p className="font-semibold text-gray-900">Secure Payments</p>
                <p className="text-sm text-gray-600">Powered by Stripe</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F4FD] rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <div>
                <p className="font-semibold text-gray-900">Transparent Tracking</p>
                <p className="text-sm text-gray-600">No hidden fees</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F4FD] rounded-full flex items-center justify-center text-2xl">
                👥
              </div>
              <div>
                <p className="font-semibold text-gray-900">Group Consensus</p>
                <p className="text-sm text-gray-600">Democratic decisions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Shared Spaces */}
      <section className="py-20 bg-white observe-animation">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                alt="Team collaboration"
                className="rounded-2xl shadow-xl w-full object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Create shared spaces for any group
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Whether it's roommates splitting rent, friends planning a trip, or family managing household expenses - create a space and invite members in seconds.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Invite unlimited members via email</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Track multiple spaces simultaneously</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Set up in under 2 minutes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 - Smart Pledges */}
      <section className="py-20 bg-[#F5F7FA] observe-animation">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Track contributions without holding money
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Our virtual ledger system tracks who owes what without holding funds in escrow. Your money stays in your account until you're ready to pay.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Real-time balance updates</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Complete transaction history</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">No money held in escrow</span>
                </li>
              </ul>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80"
                alt="Financial tracking"
                className="rounded-2xl shadow-xl w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 - Group Consent */}
      <section className="py-20 bg-white observe-animation">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
                alt="Group decision making"
                className="rounded-2xl shadow-xl w-full object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Democratic payouts with group consent
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Every payout request requires approval from group members. Fair, transparent, and democratic - everyone has a voice.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Majority or unanimous voting options</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Real-time approval notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#0070BA] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Secure payment processing via Stripe</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-[#F5F7FA] observe-animation">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              How it works
            </h2>
            <p className="text-xl text-gray-600 text-center mb-16">
              Get started in three simple steps
            </p>

            <div className="space-y-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 w-16 h-16 bg-[#0070BA] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  1
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Create a Space</h3>
                  <p className="text-gray-600">
                    Set up a shared space for your group - whether it's roommates, a vacation, or a group project.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 w-16 h-16 bg-[#0070BA] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  2
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Track Contributions</h3>
                  <p className="text-gray-600">
                    Members pledge their share of expenses. Everything is tracked transparently in a virtual ledger.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 w-16 h-16 bg-[#0070BA] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  3
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Request & Approve Payouts</h3>
                  <p className="text-gray-600">
                    Create payout requests that require group consent. Once approved, payments are processed securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Guide - Step by Step Flow */}
      <section id="user-guide" className="py-20 bg-white observe-animation">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                See how easy it is!
              </h2>
              <p className="text-xl text-gray-600">
                From setup to payout in minutes - here's your complete workflow
              </p>
            </div>

            <div className="space-y-16">
              {/* Step 1: Setup */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-[#F5F7FA] rounded-2xl p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏡</div>
                    <p className="text-gray-600 font-medium">Screenshot placeholder: Space creation form</p>
                  </div>
                </div>
                <div>
                  <div className="inline-block px-4 py-2 bg-[#0070BA] text-white rounded-full font-semibold mb-4">
                    Step 1: Setup Your Space
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Create & Invite in Seconds</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Click "Create Space" and give it a name (e.g., "NYC Apartment" or "Beach Trip 2025")</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Invite members by email - they'll get instant access</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Set your space description and rules</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500 italic">Takes less than 2 minutes!</p>
                </div>
              </div>

              {/* Step 2: Track */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1">
                  <div className="inline-block px-4 py-2 bg-[#0070BA] text-white rounded-full font-semibold mb-4">
                    Step 2: Track Contributions
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Log Pledges & Stay Balanced</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Members create pledges for their share (e.g., "$500 for rent")</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">See real-time balance updates - who's paid, who owes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Complete transparency with full transaction history</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500 italic">No money held in escrow - track virtually!</p>
                </div>
                <div className="order-1 md:order-2 bg-[#F5F7FA] rounded-2xl p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <p className="text-gray-600 font-medium">Screenshot placeholder: Pledge dashboard</p>
                  </div>
                </div>
              </div>

              {/* Step 3: Payout */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-[#F5F7FA] rounded-2xl p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-gray-600 font-medium">Screenshot placeholder: Payout approval screen</p>
                  </div>
                </div>
                <div>
                  <div className="inline-block px-4 py-2 bg-[#0070BA] text-white rounded-full font-semibold mb-4">
                    Step 3: Request & Approve Payouts
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Democratic Group Decisions</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Create a payout request (e.g., "Pay landlord $2000")</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Group members vote to approve or reject</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0070BA] font-bold">→</span>
                      <span className="text-gray-700">Once approved, payment processes securely via Stripe</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500 italic">Everyone has a voice - fair and transparent!</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-[#0070BA] mb-2">2 min</div>
                <p className="text-gray-600">Setup time</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#0070BA] mb-2">100%</div>
                <p className="text-gray-600">Transparent</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#0070BA] mb-2">Unlimited</div>
                <p className="text-gray-600">Members</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#0070BA] mb-2">Secure</div>
                <p className="text-gray-600">Stripe payments</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-[#F5F7FA] observe-animation">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                About FinanceApp
              </h2>
              <p className="text-xl text-gray-600">
                Built for transparency, designed for trust
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  FinanceApp was born from a simple frustration: managing shared expenses shouldn't be complicated, opaque, or unfair. Whether you're splitting rent with roommates, planning a group trip, or managing household expenses with family, everyone deserves transparency and control.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong className="text-gray-900">Our Mission:</strong> To make shared finance management simple, transparent, and democratic. We believe that when money is involved, everyone should have visibility and a voice.
                </p>

                <div className="grid md:grid-cols-2 gap-8 my-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Why We're Different</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>Virtual ledger system - no money held in escrow</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>Democratic voting for all payout decisions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>100% transparent transaction history</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>Enterprise-grade security via Stripe</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Perfect For</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>Roommates sharing rent and utilities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>Friends planning group trips</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>Families managing shared expenses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070BA] mt-1">•</span>
                        <span>Teams handling group projects</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mt-6">
                  <strong className="text-gray-900">Our Commitment:</strong> We're committed to keeping FinanceApp simple, secure, and user-focused. No hidden fees, no complicated terms - just straightforward tools to help groups manage money better together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0070BA] text-white observe-animation">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to simplify your shared finances?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join groups who manage their money better, together.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-[#0070BA] hover:bg-gray-100 font-semibold px-10 py-4 text-lg shadow-xl"
            >
              {state.isAuthenticated ? 'Go to Your Spaces' : 'Get Started Free'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
