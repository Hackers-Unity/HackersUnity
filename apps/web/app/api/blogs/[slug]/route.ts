import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';
import { BLOG_POSTS, BlogPost } from '@/lib/blogs-data';

interface RouteContext {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const slug = resolvedParams.slug;

    // Check Supabase first
    try {
      const serverSupabase = createAdminClient();
      const { data, error } = await serverSupabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        const blog: BlogPost = {
          id: data.id,
          slug: data.slug,
          title: data.title,
          subtitle: data.subtitle || '',
          excerpt: data.excerpt || data.subtitle || '',
          category: data.category,
          image: data.image || '/blogs/agentic-ai.jpg',
          coverGradient: data.cover_gradient || 'from-sky-600/30 via-cyan-600/20 to-blue-950/40',
          publishedAt: data.created_at
            ? new Date(data.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent',
          readTime: data.read_time || '5 min read',
          tags: Array.isArray(data.tags) ? data.tags : [],
          featured: Boolean(data.featured),
          content: Array.isArray(data.content)
            ? data.content
            : typeof data.content === 'string'
            ? [data.content]
            : data.raw_markdown
            ? data.raw_markdown.split('\n\n')
            : [],
          raw_markdown: data.raw_markdown || '',
          author_name: data.author_name || 'Community Builder',
          author_email: data.author_email || '',
          author_avatar: data.author_avatar || '',
          status: data.status,
          created_at: data.created_at,
        };

        return NextResponse.json({ success: true, blog });
      }
    } catch {
      // Ignore and fallback to static seed posts
    }

    // Fallback to static seed posts
    const staticPost = BLOG_POSTS.find((b) => b.slug === slug);
    if (staticPost) {
      return NextResponse.json({ success: true, blog: staticPost });
    }

    return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching blog' },
      { status: 500 }
    );
  }
}
