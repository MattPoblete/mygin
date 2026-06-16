/**
 * /contacto — "Contacto Comercial" (Server Component con SEO).
 *
 * La página es estática; el formulario interactivo vive en un Client Component
 * (ContactForm) que escribe en `contactSubmissions`. El aviso por correo al
 * equipo está diferido a una Cloud Function (ver components/marketing/ContactForm).
 */
import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import Icon from '@/components/ui/Icon';
import ContactForm from '@/components/marketing/ContactForm';
import site from '@/content/site';

export const metadata: Metadata = {
  title: 'Contacto Comercial — MyGin',
  description:
    'Hablemos. Distribución, pedidos al por mayor o cualquier consulta sobre MyGin, el gin contemporáneo chileno de Villarrica, Araucanía.',
  alternates: { canonical: '/contacto' },
  openGraph: {
    title: 'Contacto Comercial — MyGin',
    description:
      'Distribución, pedidos al por mayor o consultas sobre MyGin. Escríbenos.',
    url: '/contacto',
    type: 'website',
  },
};

export default function ContactoPage() {
  const b = site.brand;

  return (
    <main className="pt-32 pb-32 bg-background" id="contacto">
      <div className="container mx-auto px-8 md:px-12">
        <div className="text-center mb-20">
          <SectionHeader
            id="contacto-headline"
            label="Contacto"
            headline={'Hablemos\nde negocios.'}
            sublabel="¿Distribución, pedidos al por mayor o una consulta? Escríbenos y te respondemos."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {/* Datos de contacto */}
          <aside className="space-y-8">
            <InfoItem icon="mail" label="Correo">
              <a href={`mailto:${b.email}`} className="text-on-surface hover:text-primary transition-colors">
                {b.email}
              </a>
            </InfoItem>
            <InfoItem icon="photo_camera" label="Instagram">
              <a
                href={b.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface hover:text-primary transition-colors"
              >
                @{b.instagram}
              </a>
            </InfoItem>
            <InfoItem icon="location_on" label="Destilería">
              <span className="text-on-surface">{b.origin}</span>
            </InfoItem>
          </aside>

          {/* Formulario */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon name={icon} fill={0} className="text-secondary mt-0.5" />
      <div>
        <span className="block text-xs uppercase tracking-widest text-on-surface-variant mb-1">
          {label}
        </span>
        <span className="text-sm">{children}</span>
      </div>
    </div>
  );
}
