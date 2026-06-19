'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/cupones', label: 'Cupones' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/comentarios', label: 'Reseñas' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/admin" className="font-headline text-xl tracking-tighter">
            MyGin <span className="text-primary">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-on-surface-variant hidden sm:block">{user?.email}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs uppercase tracking-widest text-secondary hover:text-primary transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="flex gap-1 px-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 text-xs uppercase tracking-widest border-b-2 transition-colors ${
                isActive(item.href, item.exact)
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="px-6 py-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
