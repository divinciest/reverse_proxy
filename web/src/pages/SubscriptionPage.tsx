import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import HeaderEx from '@/components/layout/HeaderEx';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';

function SubscriptionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderEx />

      <main className="flex-1 container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Only $4.95 for your first month</h1>
            <div className="flex justify-center mb-6">
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg py-6">
                <Link to="/signup">Create Free Account</Link>
              </Button>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-orange-50 rounded-lg p-8 mb-10">
            <h2 className="text-3xl font-bold">Only $4.95 for 1 month</h2>
            <p className="text-xl font-semibold mb-4">After 1 month - Just $24.92/month ($299 billed after trial)</p>

            <p className="text-gray-700 mb-6">
              Introductory offer for new subscribers only. $4.95 charged immediately for a 1-month paid trial to Premium.
              After your 1-month paid trial, $299 will be charged automatically for an annual subscription unless you cancel
              during your 1-month trial. Auto-renews as an annual subscription at the then current annual list price
              (current list price is $299/year). Plus sales tax/VAT, where applicable.
            </p>
          </div>

          {/* Content Section with Sign Up and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sign Up Section - Takes 2/3 of the space */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Let's get started:</h2>

              <div className="mb-4">
                <p className="mb-2">
                  Already have an account?
                  <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                </p>
              </div>

              <div className="flex flex-col space-y-4 max-w-md">
                <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg py-6">
                  <Link to="/signup">Create Free Account</Link>
                </Button>

                <div className="flex items-center justify-center">
                  <div className="h-px bg-gray-300 flex-1" />
                  <span className="px-4 text-gray-500">or</span>
                  <div className="h-px bg-gray-300 flex-1" />
                </div>

                <Button variant="outline" size="lg" className="py-6 flex justify-center items-center gap-2">
                  <OptImage src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" width={20} height={20} />
                  Continue with Google
                </Button>

                <Button variant="outline" size="lg" className="py-6 flex justify-center items-center gap-2">
                  <OptImage src="https://www.apple.com/favicon.ico" alt="Apple" className="w-5 h-5" width={20} height={20} />
                  Continue with Apple
                </Button>

                <Button variant="outline" size="lg" className="py-6 flex justify-center items-center gap-2">
                  <OptImage src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5" width={20} height={20} />
                  Continue with Facebook
                </Button>

                <p className="text-sm text-gray-600 mt-4">
                  By creating an account using any of the options above, you agree to the
                  {' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">Terms of Use</Link>
                  {' '}
                  &
                  <Link to="/privacy" className="text-blue-600 hover:underline"> Privacy Policy</Link>
                </p>
              </div>
            </div>

            {/* Right Sidebar - Takes 1/3 of the space */}
            <div className="lg:col-span-1 border-l pl-8">
              <h2 className="text-2xl font-bold text-gray-700 mb-6">About WealthManager Premium</h2>

              <div className="space-y-8">
                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <Check className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Why Subscribe to WealthManager Premium</h3>
                    <p className="text-gray-600">Access exclusive financial insights and personalized recommendations.</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <Check className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">What Sets Premium Apart</h3>
                    <p className="text-gray-600">Advanced analytics, priority updates, and expert commentary.</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <Check className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Invest with confidence</h3>
                    <p className="text-gray-600">Make informed decisions with our comprehensive market analysis.</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <Check className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Premium Performance Graph</h3>
                    <p className="text-gray-600">Track your portfolio with advanced visualization tools.</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <Check className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">FAQs</h3>
                    <p className="text-gray-600">Find answers to common questions about our premium service.</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Join WealthManager Premium</h3>
                    <p className="text-gray-600">Subscribe today and elevate your financial strategy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 border-t-4 border-gray-900 mt-12">
        <div className="container mx-auto">
          <div className="text-center">
            <p className="font-serif text-lg">&copy; 2023 WealthManager.com - Financial News Aggregator</p>
            <p className="mt-1 text-gray-300">
              Providing aggregated financial content with AI-powered sentiment analysis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SubscriptionPage;
