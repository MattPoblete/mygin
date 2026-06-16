/**
 * site.ts — Contenido estático de marketing de MyGin (portado desde js/config.js).
 *
 * Solo contenido editorial que cambia rara vez y se renderiza con SSG:
 * hero, historia, botánicos, recetas, testimonios, distribuidores, footer.
 *
 * El catálogo vendible (productos + stock), pedidos, cupones, blog y comentarios
 * viven en Firestore — NO aquí. Ver lib/types.ts.
 */

export type CtaAction = 'link' | 'shop';

export interface Cta {
  label: string;
  /** 'primary' | 'outline' — estilo visual del botón */
  type?: 'primary' | 'outline';
  href?: string;
  /** 'link' navega interno; 'shop' apunta a la tienda (/tienda) */
  action?: CtaAction;
}

export interface SensorProfileItem {
  icon: string;
  label: string;
  value: string;
}

export interface Benefit {
  icon: string;
  title: string;
  desc: string;
}

export interface Botanical {
  name: string;
  icon: string;
  desc: string;
}

export interface Moment {
  image: string;
  caption: string;
}

export interface RecipeIngredient {
  qty: string;
  item: string;
}

export interface Recipe {
  name: string;
  emoji: string;
  desc: string;
  ingredients: RecipeIngredient[];
  method: string;
}

export interface Testimonial {
  name: string;
  location: string;
  stars: number;
  text: string;
}

export interface DistribuidorPunto {
  nombre: string;
  nota: string | null;
}

export interface Ciudad {
  ciudad: string;
  icon: string;
  puntos: DistribuidorPunto[];
}

export interface PriceTier {
  label: string;
  sublabel: string;
  price: number;
  unit: string;
  highlight: boolean;
  badge: string | null;
  features: string[];
  cta: Cta;
}

const site = {
  brand: {
    name: 'MyGin',
    tagline: 'El gin que se vive.',
    instagram: 'mygin.cl',
    instagramUrl: 'https://instagram.com/mygin.cl',
    email: 'destileriamygin@gmail.com',
    origin: 'Villarrica, Araucanía',
    coordinates: '39°S · 72°O',
    year: '2025',
  },

  nav: {
    links: [
      { label: 'Nosotros', href: '#historia' },
      { label: 'El Gin', href: '#producto' },
      { label: 'Recetas', href: '#recetas' },
      { label: 'Dónde comprar', href: '#distribuidores' },
    ],
    cta: { label: 'Pedir ahora', href: '/tienda' },
  },

  hero: {
    label: 'Gin Contemporáneo Chileno · Araucanía',
    headline: 'El sabor que\nsiempre fue chileno.',
    subheadline:
      'Destilado a las orillas del Río Pedregoso, con botánicos que ya conoces: huesillo, tomillo y 9 más.',
    bgImage: '/assets/images/hero_bg.jpeg',
    ctas: [
      { label: 'Conoce el Gin', type: 'primary', href: '#producto' },
      { label: 'Dónde comprarlo', type: 'outline', href: '#distribuidores' },
    ] as Cta[],
  },

  historia: {
    label: 'Quiénes somos',
    headline: 'Dos amigos,\nun gin chileno.',
    body: 'Andrés Jeldres y Fernando Moreno fundaron MyGin en 2025 con una obsesión simple: crear el gin que represente de verdad cómo somos los chilenos. Sin fórmulas importadas. Con el huesillo que todos conocemos, el tomillo que crece en los cerros de la Araucanía y 9 botánicos más que hacen de cada sorbo algo genuinamente nuestro.',
    quote: '"Queríamos que al probarlo, cualquier chileno dijera: esto sabe a casa."',
    quoteAuthor: '— Andrés Jeldres, co-fundador',
    stats: [
      { value: '11', label: 'Botánicos' },
      { value: '2025', label: 'Fundación' },
      { value: '100%', label: 'Chileno' },
    ],
    distillery: {
      name: 'Destilería Río Pedregoso',
      location: 'Villarrica, Región de la Araucanía',
      description:
        'A las orillas del Río Pedregoso, rodeado de la flora nativa de las montañas de la Araucanía, nace cada botella de MyGin.',
    },
  },

  producto: {
    label: 'El Producto',
    headline: '11 botánicos.\nUn solo Chile.',
    body: 'MyGin es un gin contemporáneo de alta expresión botánica. El huesillo le da un dulzor frutal único, el tomillo aporta el aroma herbal intenso, y los 9 botánicos restantes completan un perfil cítrico, cálido y redondo que no encontrarás en ningún gin importado.',
    image: '/assets/images/botella_naturaleza.jpeg',
    sensorProfile: [
      { icon: 'air', label: 'Aroma', value: 'Herbal intenso con tomillo fresco' },
      { icon: 'water_drop', label: 'Sabor', value: 'Cítrico brillante con dulzor de huesillo' },
      { icon: 'auto_awesome', label: 'Final', value: 'Largo y especiado, canela y pimienta' },
    ] as SensorProfileItem[],
    benefits: [
      {
        icon: 'eco',
        title: 'Huesillo & Tomillo',
        desc: 'Los dos botánicos estrella de MyGin: el huesillo, ícono de la gastronomía chilena, y el tomillo de los cerros de la Araucanía. Nada de esto lo encuentras en otro gin.',
      },
      {
        icon: 'payments',
        title: 'Precio que tiene sentido',
        desc: 'Calidad de gin premium a un precio que no necesita justificación. Sin intermediarios, directo desde la destilería hasta tu copa.',
      },
      {
        icon: 'local_shipping',
        title: 'Llega a tu puerta',
        desc: 'Despacho a todo Chile. Tu MyGin llega en perfectas condiciones, bien embalado, listo para abrir.',
      },
    ] as Benefit[],
    botanicals: [
      { name: 'Huesillo', icon: 'sunny', desc: 'Durazno deshidratado, el sabor más chileno del mundo. Aporta dulzor frutal y profundidad única.' },
      { name: 'Tomillo', icon: 'forest', desc: 'Recolectado en los cerros de la Araucanía. Aroma herbal intenso que define el carácter de MyGin.' },
      { name: 'Enebro', icon: 'spa', desc: 'La base clásica de todo gin. Frescura y el carácter junípero que une todos los botánicos.' },
      { name: 'Canela', icon: 'local_cafe', desc: 'Calidez especiada que redondea el final y le da cuerpo al conjunto.' },
      { name: 'Cardamomo', icon: 'grass', desc: 'Complejidad aromática y un toque floral que eleva cada sorbo.' },
      { name: 'Semillas de Cilantro', icon: 'scatter_plot', desc: 'Frescura cítrica suave que conecta los botánicos y aporta ligereza.' },
      { name: 'Limón Deshidratado', icon: 'brightness_5', desc: 'Cítrico brillante que aparece desde el primer sorbo y se alarga en el final.' },
      { name: 'Naranja Deshidratada', icon: 'circle', desc: 'Dulzor cítrico que equilibra los botánicos especiados y aporta redondez.' },
      { name: 'Clavo de Olor', icon: 'star', desc: 'Calidez profunda y notas especiadas que agregan capas de sabor al gin.' },
      { name: 'Pimienta Negra', icon: 'whatshot', desc: 'Picante sutil en el final que da personalidad y hace que el gin se recuerde.' },
      { name: 'Raíz de Angélica', icon: 'psychology', desc: 'El botánico que une todo. Aporta profundidad herbácea y es el ancla del conjunto.' },
    ] as Botanical[],
  },

  experiencia: {
    label: 'La Experiencia',
    headline: 'No vendemos gin,\nvendemos momentos.',
    moments: [
      { image: '/assets/images/amigos.jpeg', caption: 'Esa noche que se alarga sin querer.' },
      { image: '/assets/images/supermercado.jpeg', caption: 'El instante perfecto.' },
      { image: '/assets/images/marciano.jpeg', caption: 'El gin que eleva cualquier escenario.' },
      { image: '/assets/images/botella_naturaleza.jpeg', caption: 'Botánicos chilenos, pureza natural.' },
    ] as Moment[],
  },

  recetas: {
    label: 'Cócteles',
    headline: 'Tres formas de\ntomarlo bien.',
    sublabel:
      'Recetas creadas especialmente con MyGin. Ingredientes que encuentras en cualquier botillería.',
    items: [
      {
        name: 'Maqui Collins',
        emoji: '🫐',
        desc: 'El azul profundo del maqui chileno con el sabor herbal de MyGin. Refrescante, frutoso y distinto a cualquier Collins que hayas tomado.',
        ingredients: [
          { qty: '2 oz', item: 'MyGin' },
          { qty: '0.15 ml', item: 'Óleo de limón' },
          { qty: '1.5 oz', item: 'Jugo de limón fresco' },
          { qty: '1.5 oz', item: 'Syrup de maqui' },
          { qty: 'c/n', item: 'Agua tónica premium' },
        ],
        method: 'Shaker con hielo · Colar en copa highball · Top de tónica · Garnish con rodaja de limón',
      },
      {
        name: 'Pepino Sour',
        emoji: '🥒',
        desc: 'El pepino fresco potencia los botánicos herbales de MyGin. La albúmina da una espuma sedosa que hace que este sour sea visualmente imposible de ignorar.',
        ingredients: [
          { qty: '2 oz', item: 'MyGin' },
          { qty: '1 oz', item: 'Jugo de limón fresco' },
          { qty: '1 oz', item: 'Syrup simple' },
          { qty: '1 rodaja', item: 'Pepino fresco' },
          { qty: '1 cdta', item: 'Albúmina (clara de huevo)' },
          { qty: '3 gotas', item: 'Amargo Angostura' },
        ],
        method: 'Dry shake · Shake con hielo · Doble colar · Copa coupe · Gotas de Angostura en la espuma',
      },
      {
        name: 'Pomelo Sour',
        emoji: '🍊',
        desc: 'El pomelo amplifica los cítricos del MyGin y el huesillo aparece en el final. Simple de hacer, imposible de olvidar.',
        ingredients: [
          { qty: '2 oz', item: 'MyGin' },
          { qty: '1 oz', item: 'Jugo de pomelo fresco' },
          { qty: '0.5 oz', item: 'Jugo de limón' },
          { qty: '1 oz', item: 'Syrup simple' },
          { qty: '1 cdta', item: 'Albúmina (clara de huevo)' },
        ],
        method: 'Dry shake · Shake con hielo · Colar en copa coupe · Twist de pomelo como garnish',
      },
    ] as Recipe[],
  },

  testimonios: {
    headline: 'Lo que dicen.',
    items: [
      {
        name: 'Matías R.',
        location: 'Sommelier, Pucón',
        stars: 5,
        text: '"Una sorpresa absoluta. La calidad compite fácilmente con marcas que duplican su precio. El huesillo cambia todo."',
      },
      {
        name: 'Carla V.',
        location: 'Content Creator, Santiago',
        stars: 5,
        text: '"El packaging es increíble y el gin es aún mejor. Ahora es el fijo para el Gin & Tonic del fin de semana."',
      },
      {
        name: 'Andrés L.',
        location: 'Arquitecto, Villarrica',
        stars: 5,
        text: '"Lo pedí en el Skybar y me enamoré. Sutil pero presente, eso que hace un buen gin. Ahora siempre tengo una botella en casa."',
      },
    ] as Testimonial[],
  },

  distribuidores: {
    label: 'Dónde comprar',
    headline: 'Ya estamos\nen tu ciudad.',
    sublabel:
      'Encuéntranos en bares, restaurantes y botillerías de la zona lacustre de la Araucanía.',
    ciudades: [
      {
        ciudad: 'Pucón',
        icon: 'restaurant',
        puntos: [
          { nombre: 'Restaurante Campos', nota: 'Carta propia de MyGin' },
          { nombre: 'La Fuente', nota: null },
          { nombre: 'Mamás y Tapas', nota: null },
        ],
      },
      {
        ciudad: 'Villarrica',
        icon: 'local_bar',
        puntos: [
          { nombre: 'Skybar', nota: null },
          { nombre: 'Fuego Patagón', nota: null },
        ],
      },
      {
        ciudad: 'Botillerías',
        icon: 'storefront',
        puntos: [
          { nombre: 'GyG Botillería', nota: null },
          { nombre: 'La Bodeguita', nota: null },
          { nombre: 'Chelenko Botillería', nota: null },
        ],
      },
      {
        ciudad: 'Supermercados',
        icon: 'shopping_cart',
        puntos: [{ nombre: 'Supermercados Trébol', nota: null }],
      },
    ] as Ciudad[],
    onlineCta: { label: 'Pedir online', href: '/tienda', type: 'primary' } as Cta,
  },

  precios: {
    label: 'Precios',
    headline: 'Simple, directo,\nsin letra chica.',
    tiers: [
      {
        label: 'Botella Individual',
        sublabel: '750 ml · Gin Contemporáneo',
        price: 17990,
        unit: '/ botella',
        highlight: false,
        badge: null,
        features: [
          'MyGin Gin Contemporáneo',
          'Recetario Digital incluido',
          'Despacho a todo Chile',
        ],
        cta: { label: 'Comprar ahora', action: 'shop' },
      },
      {
        label: 'Pack Amigos',
        sublabel: '2 Botellas · Ahorra $3.000',
        price: 32990,
        unit: '/ pack',
        highlight: true,
        badge: 'Lo más pedido',
        features: [
          '2x MyGin Gin Contemporáneo',
          'Recetario Digital incluido',
          'Envío Priority 24h',
          'Descuento en próximas compras',
        ],
        cta: { label: 'Comprar ahora', action: 'shop' },
      },
    ] as PriceTier[],
  },

  urgencyBanner: {
    headline: 'Stock limitado.',
    sublabel: 'Lote #048 — producción artesanal en cantidades reducidas.',
    cta: { label: 'Asegurar mi MyGin', action: 'shop' } as Cta,
  },

  footer: {
    links: [
      { label: 'Drink Responsibly', href: '#' },
      { label: 'Equipo', href: '/equipo' },
      { label: 'Contacto', href: '/contacto' },
      { label: 'Instagram', href: 'https://instagram.com/mygin.cl' },
    ],
    copy: '© 2025 MyGin. Crafted en Villarrica, Araucanía, Chile.',
    note: 'Venta exclusiva a mayores de 18 años.',
    minsal:
      'El alcohol en exceso daña tu salud · No manejes bajo sus efectos · Riesgo en el embarazo · No dar a menores de 18 años · Ministerio de Salud',
  },
} as const;

export default site;
