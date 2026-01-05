export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} OnboardLy. All rights reserved.
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
            <a
              href="#"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Support
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
