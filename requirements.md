1.1 Requerimientos Funcionales
Catálogo y Carrito de Compras: Visualización de productos (ginebras, botánicos, merchandising) con carrito persistente en el navegador. Cálculo automático de subtotales.
Pasarela de Pago (Flow): Integración nativa con el conector de Flow para procesar pagos con tarjetas de débito/crédito y transferencias vía Webpay.
Control de Inventario Centralizado: Descuento automático de stock post-compra. Prevención de "overselling" mediante validaciones atómicas en tiempo real para productos de alta demanda o stock limitado.
Motor de Promociones (Códigos de Descuento): Capacidad de crear y validar cupones (ej: descuentos porcentuales, monto fijo o envío gratis) aplicables antes del pago.
Gestor de Contenidos (Blog): Sección auto-administrable para publicar artículos, recetas de coctelería y noticias de la destilería.
Sistema de Interacción (Comentarios): Módulo para que los clientes dejen reseñas en productos o artículos del blog, con estado de moderación previo a la publicación.
Secciones Corporativas: Páginas estáticas optimizadas para SEO, incluyendo "Nuestro Equipo" y un formulario dinámico de "Contacto Comercial".

1.2 Requerimientos No Funcionales y Arquitectura
Frontend: Desarrollo moderno y responsivo (Mobile-first) utilizando Next.js o React SPA, alojado en Firebase Hosting.
Base de Datos: Cloud Firestore (NoSQL) para almacenar catálogo, stock, artículos y configuraciones de forma ágil.
Backend y Seguridad: Firebase Cloud Functions para manejar de manera segura el Webhook de Flow (confirmación de pagos) sin exponer llaves privadas en el frontend. Implementación de Reglas de Seguridad estrictas en Firestore.
