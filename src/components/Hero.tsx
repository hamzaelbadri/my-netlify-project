import React from 'react';
import { Calendar, Clock, Shield } from 'lucide-react';
import { Button } from './Button';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Manage your Facebook</span>
                <span className="block text-[#1877F2]">posts with ease</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
                Schedule, manage, and automate your Facebook posts with our intuitive platform. Save time and maintain a consistent social media presence.
              </p>
              <div className="mt-5 sm:mt-8 flex justify-center">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="px-12"
                >
                  Get Started
                </Button>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <Feature
                icon={<Calendar className="h-6 w-6 text-[#1877F2]" />}
                title="Easy Scheduling"
                description="Schedule your posts ahead of time and maintain a consistent posting schedule."
              />
              <Feature
                icon={<Clock className="h-6 w-6 text-[#1877F2]" />}
                title="Time-Saving"
                description="Automate your posting process and save valuable time for other tasks."
              />
              <Feature
                icon={<Shield className="h-6 w-6 text-[#1877F2]" />}
                title="Secure Access"
                description="Your Facebook account is protected with secure authentication and authorization."
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="pt-6">
      <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
        <div className="-mt-6">
          <div>
            <span className="inline-flex items-center justify-center rounded-md bg-[#1877F2] p-3 shadow-lg">
              {icon}
            </span>
          </div>
          <h3 className="mt-8 text-lg font-medium tracking-tight text-gray-900">{title}</h3>
          <p className="mt-5 text-base text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}