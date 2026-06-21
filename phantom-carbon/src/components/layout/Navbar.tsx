'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface NavbarProps {
  userName?: string | null;
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/upload', label: 'Upload', icon: '📄' },
  { href: '/oracle', label: 'Oracle', icon: '🔮' },
  { href: '/community', label: 'Community', icon: '🏆' },
];

export function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-md border-b border-gray-800">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-500 rounded"
          aria-label="Phantom Carbon — go to dashboard"
        >
          <span className="text-xl" aria-hidden="true">👻</span>
          <span className="font-bold hidden sm:block">Phantom Carbon</span>
        </Link>

        {/* Nav links */}
        <ul className="flex items-center gap-1" role="list">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors
                    focus-visible:ring-2 focus-visible:ring-green-500
                    ${isActive
                      ? 'bg-green-900/30 text-green-400 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="hidden sm:inline" aria-hidden="true">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {userName && (
            <span className="text-sm text-gray-500 hidden md:block" aria-label={`Signed in as ${userName}`}>
              {userName}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: `${window.location.origin}/` })}
            className="text-sm text-gray-500 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-green-500"
            aria-label="Sign out of Phantom Carbon"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
