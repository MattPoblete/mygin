'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import BlogPostForm from '@/components/admin/BlogPostForm';
import { getPost } from '@/lib/blog';
import type { BlogPost } from '@/lib/types.blog';

export default function EditarArticuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    getPost(id)
      .then(setPost)
      .catch(() => setPost(null));
  }, [id]);

  if (post === undefined) {
    return <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>;
  }

  if (post === null) {
    return (
      <div>
        <p className="text-error text-sm mb-4">Artículo no encontrado.</p>
        <Link href="/admin/blog" className="text-primary text-xs uppercase tracking-widest">
          ← Volver al blog
        </Link>
      </div>
    );
  }

  return <BlogPostForm post={post} />;
}
