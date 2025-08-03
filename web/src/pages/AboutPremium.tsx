import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import HeaderEx from '@/components/layout/HeaderEx';
import { Button } from '@/components/ui/button';

function AboutPremium() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderEx />

      <main className="flex-1 container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">About WealthManager Premium</h1>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Premium Features</h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Exclusive Financial Insights</h3>
                  <p className="text-gray-600">
                    Access in-depth analysis and expert commentary on market trends, investment opportunities, and economic forecasts.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Advanced Portfolio Tools</h3>
                  <p className="text-gray-600">
                    Utilize sophisticated portfolio tracking and optimization tools to maximize your investment returns.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Real-time Alerts</h3>
                  <p className="text-gray-600">
                    Receive instant notifications about market movements, breaking news, and investment opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ad-free Experience</h3>
                  <p className="text-gray-600">
                    Enjoy a clean, distraction-free interface without advertisements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Subscription Details</h2>
            <p className="text-lg mb-3">
              <span className="font-semibold">Only $4.95 for your first month</span>
              , then $24.92/month
              ($299 billed annually).
            </p>
            <p className="text-gray-700 mb-6">
              Access all premium features with our risk-free trial. Cancel anytime during your first month.
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg">
                <Link to="/subscription" className="flex items-center">
                  Subscribe Now
                  {' '}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 border-t-4 border-gray-900">
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

export default AboutPremium;
