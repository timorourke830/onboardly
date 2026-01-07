import Link from "next/link";
import {
  Upload,
  FolderSearch,
  Download,
  ArrowRight,
  Check,
  Quote,
  Zap,
} from "lucide-react";

const steps = [
  {
    number: "1",
    title: "UPLOAD",
    description:
      "Drag & drop client docs — receipts, invoices, statements, contracts",
    icon: Upload,
  },
  {
    number: "2",
    title: "SORT",
    description: "AI categorizes everything and builds your Chart of Accounts",
    icon: FolderSearch,
  },
  {
    number: "3",
    title: "EXPORT",
    description: "One-click export to QBO, QBD, or Xero",
    icon: Download,
  },
];

const benefits = [
  "Sort a client's entire document pile in minutes, not hours",
  "Auto-generate Chart of Accounts by industry",
  "Export directly to QuickBooks Online, Desktop, or Xero",
  "Built by a fractional bookkeeper who lived this pain",
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                OnboardLy
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section - Everything above the fold */}
        <section className="relative bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium mb-6">
                <span className="flex h-2 w-2 rounded-full bg-teal-500"></span>
                For Fractional Bookkeepers
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                From Shoebox to Chart of Accounts{" "}
                <span className="text-teal-600">in Under 2 Hours</span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                AI-powered document sorting for fractional bookkeepers. Upload
                the mess, export to QuickBooks, Xero, or QuickBooks Desktop.
              </p>

              {/* CTA Button */}
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-600/25 transition-all hover:shadow-xl hover:shadow-teal-600/30"
                >
                  Sort Your First Client Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* 3-Step Process - Visible above the fold */}
            <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-200 z-10" />
                  )}

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                        <step.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-600 text-white text-xs font-bold">
                          {step.number}
                        </span>
                        <h3 className="text-sm font-bold text-teal-600 tracking-wide">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pain Point Section */}
        <section className="py-16 lg:py-20 bg-slate-900 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <Quote className="h-10 w-10 text-teal-400 mx-auto mb-6 opacity-50" />
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed text-slate-100">
              Day Zero with a new client shouldn&apos;t cost you{" "}
              <span className="text-teal-400">3 unbillable hours</span> digging
              through a shoebox of receipts.
            </p>
            <p className="mt-6 text-lg text-slate-400">
              You became a bookkeeper to do books — not to play document
              detective.
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  Stop sorting.
                  <br />
                  <span className="text-teal-600">Start booking.</span>
                </h2>

                <ul className="mt-8 space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100">
                          <Check className="h-3 w-3 text-teal-600" />
                        </div>
                      </div>
                      <span className="text-gray-700 leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                  >
                    Try It Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Visual representation */}
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-8 border border-slate-200">
                  {/* Before/After visual */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                        Before
                      </p>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-8 bg-red-50 border border-red-100 rounded flex items-center px-2"
                          >
                            <div className="h-3 w-3 bg-red-300 rounded mr-2" />
                            <div className="h-2 bg-red-200 rounded flex-1" />
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Unsorted chaos
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                        After
                      </p>
                      <div className="space-y-2">
                        <div className="h-8 bg-teal-50 border border-teal-100 rounded flex items-center px-2">
                          <div className="h-3 w-3 bg-teal-400 rounded mr-2" />
                          <div className="h-2 bg-teal-200 rounded flex-1" />
                        </div>
                        <div className="h-8 bg-blue-50 border border-blue-100 rounded flex items-center px-2">
                          <div className="h-3 w-3 bg-blue-400 rounded mr-2" />
                          <div className="h-2 bg-blue-200 rounded flex-1" />
                        </div>
                        <div className="h-8 bg-amber-50 border border-amber-100 rounded flex items-center px-2">
                          <div className="h-3 w-3 bg-amber-400 rounded mr-2" />
                          <div className="h-2 bg-amber-200 rounded flex-1" />
                        </div>
                        <div className="h-8 bg-purple-50 border border-purple-100 rounded flex items-center px-2">
                          <div className="h-3 w-3 bg-purple-400 rounded mr-2" />
                          <div className="h-2 bg-purple-200 rounded flex-1" />
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Organized by category
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 bg-slate-50 border-y border-slate-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <Quote className="h-8 w-8 text-teal-500 mb-4" />
              <blockquote className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed">
                &ldquo;Finally, something that handles the part of onboarding I
                actually hate.&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-700 font-semibold text-sm">
                    BT
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Beta Tester</p>
                  <p className="text-sm text-gray-500">Fractional Bookkeeper</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Ready to stop sorting shoeboxes?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built by a fractional bookkeeper who got tired of sorting
              shoeboxes.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-600/25 transition-all hover:shadow-xl"
              >
                Sort Your First Client Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                OnboardLy
              </span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} OnboardLy. All rights reserved.
            </p>
            <nav className="flex gap-6">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
