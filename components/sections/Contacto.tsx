import Link from 'next/link';
import site from '@/content/site';
import SectionTitle from '@/components/ui/SectionTitle';
import ContactForm from '@/components/marketing/ContactForm';

/**
 * Contacto — calca ui_kits/website/Contact.jsx: sección navy, columna de datos
 * con etiquetas carmesí + formulario real (ContactForm, escribe en Firestore).
 * Mismo set de datos y tono que /contacto (una sola fuente de info de contacto).
 */
export default function Contacto() {
  const b = site.brand;
  const info: { label: string; value: string; href?: string; external?: boolean }[] = [
    { label: 'Dónde', value: 'Villarrica, Región de La Araucanía, Chile' },
    { label: 'Correo', value: b.email, href: `mailto:${b.email}` },
    { label: 'WhatsApp', value: b.whatsapp, href: b.whatsappUrl, external: true },
    { label: 'Instagram', value: `@${b.instagram}`, href: b.instagramUrl, external: true },
  ];

  return (
    <section id="contacto" className="px-8 md:px-12 py-16 md:py-24" style={{ background: 'var(--navy)' }}>
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start" style={{ maxWidth: 980 }}>
        <div className="reveal">
          <SectionTitle
            tone="dark"
            eyebrow="Contacto"
            title="Escríbenos"
            subtitle="¿Distribución, eventos o solo un saludo? Estamos en Villarrica, Región de la Araucanía."
          />
          <div className="flex flex-col gap-3.5 mt-8">
            {info.map(({ label, value, href, external }) => (
              <div key={label} className="grid gap-4" style={{ gridTemplateColumns: '90px 1fr' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--crimson)' }}>{label}</span>
                {href ? (
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--cream)' }}
                  >
                    {value}
                  </a>
                ) : (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--cream)' }}>{value}</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6" style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>
            <Link href="/contacto" style={{ color: 'var(--crimson)' }}>
              ¿Consulta comercial o distribución? Ir a Contacto →
            </Link>
          </p>
        </div>

        <div className="reveal reveal--delay-1" style={{ background: 'var(--surface-container-low, #1e3e57)', borderRadius: 'var(--radius-xl)', padding: 'var(--sp-xl)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
