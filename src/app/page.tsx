import Link from "next/link";
import { Upload, FileSearch, Download, ArrowRight, CheckCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const features = [
  {
    icon: <Upload className="h-6 w-6" />,
    title: "Upload Documents",
    description:
      "Drag and drop PDFs, images, and spreadsheets. We accept bank statements, receipts, invoices, and more.",
  },
  {
    icon: <FileSearch className="h-6 w-6" />,
    title: "AI Classification",
    description:
      "Our AI automatically categorizes documents, extracts key data, and identifies what's missing.",
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: "Export to Accounting Software",
    description:
      "Generate Chart of Accounts and export to QuickBooks Online, QuickBooks Desktop, or Xero.",
  },
];

const benefits = [
  "Sort a shoebox of documents in minutes",
  "AI-powered document classification",
  "Industry-specific Chart of Accounts templates",
  "Export to QuickBooks and Xero",
  "Identify missing documents automatically",
  "Secure cloud storage for all files",
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Sort client documents in{" "}
                <span className="text-blue-600">minutes</span>, not hours
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
                OnboardLy helps fractional bookkeepers automate the &quot;Day Zero&quot;
                problem. Upload a shoebox of mixed documents and let AI classify,
                organize, and generate a Chart of Accounts for your new clients.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Three simple steps to transform chaos into organized financials
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    {feature.icon}
                  </div>
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits section */}
        <section className="bg-gray-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Built for fractional bookkeepers
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Stop spending 3+ hours of unbillable time sorting through new
                  client documents. OnboardLy handles the tedious work so you can
                  focus on what matters.
                </p>
                <ul className="mt-8 space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <FileSearch className="mx-auto h-16 w-16 text-blue-600" />
                    <p className="mt-4 text-lg font-medium text-blue-900">
                      AI-Powered Document Processing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ready to streamline client onboarding?
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Start your free trial today. No credit card required.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-4 text-lg font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
