import { Shield } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold">SkillChain</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Blockchain-powered skill verification and credential management
              platform.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Platform</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/credentials"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Credentials
                </Link>
              </li>
              <li>
                <Link
                  href="/assessments"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Assessments
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Job Matching
                </Link>
              </li>
              <li>
                <Link
                  href="/verify"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Verify Credential
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-gray-500">Documentation</span>
              </li>
              <li>
                <span className="text-sm text-gray-500">API Reference</span>
              </li>
              <li>
                <span className="text-sm text-gray-500">Smart Contracts</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-gray-500">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-gray-500">Terms of Service</span>
              </li>
              <li>
                <span className="text-sm text-gray-500">GDPR Compliance</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SkillChain. Built with blockchain
            technology for secure credential verification.
          </p>
        </div>
      </div>
    </footer>
  );
}
