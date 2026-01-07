import Link from "next/link";
import {
  Upload,
  FolderSearch,
  Download,
  ArrowRight,
  Check,
  Quote,
  Zap,
  GitBranch,
  AlertTriangle,
  HelpCircle,
  FileText,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const steps = [
  {
    number: "1",
    title: "UPLOAD",
    description:
      "Drop in client docs — receipts, invoices, bank statements, contracts",
    icon: Upload,
  },
  {
    number: "2",
    title: "SORT & IDENTIFY",
    description: "AI categorizes documents and extracts transactions",
    icon: FolderSearch,
  },
  {
    number: "3",
    title: "MAP TO ACCOUNTS",
    description:
      "Auto-generates Chart of Accounts and assigns each transaction",
    icon: GitBranch,
  },
  {
    number: "4",
    title: "EXPORT",
    description: "Download a ready-to-import file for QBO, QBD, or Xero",
    icon: Download,
  },
];

const benefits = [
  "Onboard a new client in hours, not days",
  "AI extracts and categorizes every transaction",
  "Auto-generate a Chart of Accounts tailored to their industry",
  "Export a ready-to-import file for QuickBooks Online, Desktop, or Xero",
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
        {/* Hero Section */}
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
                AI-powered client onboarding for fractional bookkeepers. Upload
                the document chaos, and get back a ready-to-import file for
                QuickBooks, Xero, or QuickBooks Desktop — with transactions
                categorized and mapped to your Chart of Accounts.
              </p>

              {/* CTA Button */}
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-600/25 transition-all hover:shadow-xl hover:shadow-teal-600/30"
                >
                  Onboard Your First Client Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* 4-Step Process */}
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
                >
                  {/* Connector line for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-200 z-10" />
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors mb-3">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
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
              ))}
            </div>
          </div>
        </section>

        {/* Pain Point Section */}
        <section className="py-16 lg:py-20 bg-slate-900 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <Quote className="h-10 w-10 text-teal-400 mx-auto mb-6 opacity-50" />
            <p className="text-xl sm:text-2xl lg:text-2xl font-medium leading-relaxed text-slate-100">
              &ldquo;I hate the feeling right after I sign a new client — that
              moment when they hand over boxes of old documents and I realize
              the backwork is about to begin. Going from the high of landing a
              client to the low of sorting through chaos...{" "}
              <span className="text-teal-400">
                it almost makes me dread signing new clients.
              </span>{" "}
              Almost.&rdquo;
            </p>
            <p className="mt-8 text-base text-slate-500 italic">
              — Every fractional bookkeeper, at some point
            </p>
          </div>
        </section>

        {/* Before/After Section - Most visually striking */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                The transformation is{" "}
                <span className="text-teal-600">real</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* BEFORE - Chaotic shoebox */}
              <div className="relative">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide">
                      <AlertTriangle className="h-3 w-3" />
                      Before
                    </span>
                    <span className="text-sm text-red-600 font-medium">
                      Day Zero: The Shoebox
                    </span>
                  </div>

                  {/* Chaotic visual representation */}
                  <div className="relative bg-white rounded-xl p-4 min-h-[280px] border border-red-100 overflow-hidden">
                    {/* Scattered papers effect */}
                    <div className="absolute inset-0">
                      {/* Crumpled receipt 1 */}
                      <div className="absolute top-2 left-4 transform -rotate-12">
                        <div className="w-16 h-20 bg-yellow-100 border border-yellow-300 rounded shadow-sm flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-yellow-600 opacity-60" />
                        </div>
                      </div>
                      {/* Invoice 2 */}
                      <div className="absolute top-8 right-6 transform rotate-6">
                        <div className="w-20 h-24 bg-slate-100 border border-slate-300 rounded shadow-sm flex items-center justify-center">
                          <FileText className="h-6 w-6 text-slate-500 opacity-60" />
                        </div>
                      </div>
                      {/* Spreadsheet 3 */}
                      <div className="absolute bottom-16 left-8 transform rotate-3">
                        <div className="w-18 h-22 bg-green-50 border border-green-200 rounded shadow-sm flex items-center justify-center p-2">
                          <FileSpreadsheet className="h-6 w-6 text-green-600 opacity-60" />
                        </div>
                      </div>
                      {/* Receipt 4 */}
                      <div className="absolute top-20 left-1/3 transform -rotate-6">
                        <div className="w-14 h-18 bg-orange-50 border border-orange-200 rounded shadow-sm flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-orange-500 opacity-60" />
                        </div>
                      </div>
                      {/* Question marks */}
                      <div className="absolute top-4 right-1/3">
                        <HelpCircle className="h-6 w-6 text-red-400 opacity-70" />
                      </div>
                      <div className="absolute bottom-8 right-12">
                        <HelpCircle className="h-5 w-5 text-red-400 opacity-50" />
                      </div>
                      {/* Warning icon */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <AlertTriangle className="h-8 w-8 text-red-500 opacity-60" />
                      </div>
                      {/* More scattered elements */}
                      <div className="absolute bottom-12 right-4 transform rotate-12">
                        <div className="w-12 h-16 bg-purple-50 border border-purple-200 rounded shadow-sm"></div>
                      </div>
                      <div className="absolute top-1/2 left-2 transform -rotate-8">
                        <div className="w-10 h-14 bg-blue-50 border border-blue-200 rounded shadow-sm"></div>
                      </div>
                    </div>

                    {/* Overlay stress indicators */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-red-300 opacity-30">
                          ???
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-red-600 font-medium">
                      Unbillable chaos
                    </span>
                    <span className="text-red-500">Hours of sorting ahead</span>
                  </div>
                </div>
              </div>

              {/* AFTER - Clean dashboard */}
              <div className="relative">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border-2 border-teal-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wide">
                      <CheckCircle2 className="h-3 w-3" />
                      After
                    </span>
                    <span className="text-sm text-teal-600 font-medium">
                      2 Hours Later: Ready to Book
                    </span>
                  </div>

                  {/* Clean organized visual */}
                  <div className="bg-white rounded-xl p-4 min-h-[280px] border border-teal-100">
                    {/* Mini P&L / Dashboard */}
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                          Chart of Accounts
                        </span>
                        <span className="text-xs text-teal-600 font-medium">
                          Ready to Import
                        </span>
                      </div>

                      {/* Account categories */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-teal-50 rounded-lg border border-teal-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-teal-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Revenue
                            </span>
                          </div>
                          <span className="text-sm text-teal-600 font-semibold">
                            12 transactions
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Operating Expenses
                            </span>
                          </div>
                          <span className="text-sm text-blue-600 font-semibold">
                            34 transactions
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Office & Admin
                            </span>
                          </div>
                          <span className="text-sm text-amber-600 font-semibold">
                            18 transactions
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Travel & Meals
                            </span>
                          </div>
                          <span className="text-sm text-purple-600 font-semibold">
                            8 transactions
                          </span>
                        </div>
                      </div>

                      {/* Export ready badge */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-medium text-slate-600">
                              72 transactions mapped
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            <Check className="h-3 w-3" />
                            Export Ready
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-teal-600 font-medium">
                      Billable from day one
                    </span>
                    <span className="text-teal-500">
                      Ready for QuickBooks/Xero
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Stop sorting.{" "}
                <span className="text-teal-600">Start booking.</span>
              </h2>

              <ul className="mt-10 space-y-4 text-left max-w-xl mx-auto">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
                        <Check className="h-4 w-4 text-teal-600" />
                      </div>
                    </div>
                    <span className="text-lg text-gray-700 leading-relaxed">
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
                  Onboard Your First Client Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-16 bg-slate-50 border-y border-slate-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <Quote className="h-8 w-8 text-teal-500 mb-4" />
              <blockquote className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed">
                &ldquo;I used to block off an entire week for new client
                onboarding. Now I&apos;m done before lunch.{" "}
                <span className="text-teal-600">This thing actually works.</span>
                &rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                {/* AI-style professional headshot placeholder */}
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">SM</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Mitchell</p>
                  <p className="text-sm text-gray-500">
                    Fractional Bookkeeper, Denver CO
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Ready for client onboarding to take{" "}
              <span className="text-teal-600">hours instead of days?</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built by a fractional bookkeeper who got tired of the shoebox
              dread.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-600/25 transition-all hover:shadow-xl"
              >
                Onboard Your First Client Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required</p>
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
