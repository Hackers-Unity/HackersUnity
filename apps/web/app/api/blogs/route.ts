import { NextResponse } from 'next/server';
import { createAdminClient, authenticateRequest } from '@/lib/api-auth';
import { BLOG_POSTS, BlogPost } from '@/lib/blogs-data';

// Helper to generate a clean URL slug
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const rand = Math.random().toString(36).substring(2, 7);
  return `${base || 'tech-article'}-${rand}`;
}

// Calculate read time based on word count
function calculateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * GET /api/blogs
 * Returns all approved blogs from Supabase, merged with standard platform playbooks.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    let supabaseBlogs: BlogPost[] = [];

    try {
      const serverSupabase = createAdminClient();
      let dbQuery = serverSupabase
        .from('blogs')
        .select('*')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

      if (category && category !== 'ALL') {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;

      if (!error && data) {
        supabaseBlogs = data.map((row: any) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          subtitle: row.subtitle || '',
          excerpt: row.excerpt || row.subtitle || '',
          category: row.category,
          image: row.image || '/blogs/agentic-ai.jpg',
          coverGradient: row.cover_gradient || 'from-sky-600/30 via-cyan-600/20 to-blue-950/40',
          publishedAt: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent',
          readTime: row.read_time || '5 min read',
          tags: Array.isArray(row.tags) ? row.tags : [],
          featured: Boolean(row.featured),
          content: Array.isArray(row.content)
            ? row.content
            : typeof row.content === 'string'
            ? [row.content]
            : row.raw_markdown
            ? row.raw_markdown.split('\n\n')
            : [],
          raw_markdown: row.raw_markdown || '',
          author_name: row.author_name || 'Community Builder',
          author_email: row.author_email || '',
          author_avatar: row.author_avatar || '',
          status: row.status,
          created_at: row.created_at,
        }));
      }
    } catch {
      // Supabase connection or table error - fallback smoothly
    }

    // Filter seed playbooks if category or query provided
    let staticPosts = [...BLOG_POSTS];
    if (category && category !== 'ALL') {
      staticPosts = staticPosts.filter((p) => p.category === category);
    }

    // Merge: newly approved Supabase blogs appear on top, followed by seed playbooks
    // Deduplicate by slug
    const seenSlugs = new Set<string>();
    const allBlogs: BlogPost[] = [];

    for (const blog of [...supabaseBlogs, ...staticPosts]) {
      if (!seenSlugs.has(blog.slug)) {
        seenSlugs.add(blog.slug);
        allBlogs.push(blog);
      }
    }

    // Apply text search query if provided
    let results = allBlogs;
    if (query) {
      const q = query.toLowerCase().trim();
      results = allBlogs.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.subtitle.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      supabaseCount: supabaseBlogs.length,
      blogs: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blogs
 * Allows builders to create and submit a new blog article for admin approval.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      subtitle,
      excerpt,
      category,
      image,
      coverGradient,
      content,
      rawMarkdown,
      tags = [],
      authorName,
      authorEmail,
      authorAvatar,
    } = body;

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Headline / Title is required.' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Domain category is required.' },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const cleanSubtitle = (subtitle || '').trim();
    const cleanExcerpt = (excerpt || cleanSubtitle || cleanTitle).trim();
    const cleanCategory = category.trim();
    const cleanImage =
      (image || '').trim() ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    const cleanMarkdown = (rawMarkdown || '').trim();

    // Parse content array (split paragraphs if array not provided)
    let parsedContent: string[] = [];
    if (Array.isArray(content) && content.length > 0) {
      parsedContent = content;
    } else if (cleanMarkdown) {
      parsedContent = cleanMarkdown
        .split(/\n\n+/)
        .map((p: string) => p.trim())
        .filter(Boolean);
    }

    if (parsedContent.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog content or description cannot be empty.' },
        { status: 400 }
      );
    }

    // Check optional authenticated user session
    let authorId: string | null = null;
    let resolvedAuthorName = (authorName || 'Community Builder').trim();
    let resolvedAuthorEmail = (authorEmail || '').trim();

    try {
      const auth = await authenticateRequest(req);
      if (auth?.userId) {
        authorId = auth.userId;
        if (!authorEmail && auth.email) {
          resolvedAuthorEmail = auth.email;
        }
        if (!authorName && auth.user.user_metadata?.full_name) {
          resolvedAuthorName = auth.user.user_metadata.full_name;
        }
      }
    } catch {
      // Unauthenticated submission allowed with provided name/email
    }

    const slug = generateSlug(cleanTitle);
    const fullText = `${cleanTitle} ${cleanSubtitle} ${parsedContent.join(' ')}`;
    const readTime = calculateReadTime(fullText);

    const insertPayload = {
      slug,
      title: cleanTitle,
      subtitle: cleanSubtitle,
      excerpt: cleanExcerpt,
      category: cleanCategory,
      image: cleanImage,
      cover_gradient:
        coverGradient || 'from-sky-600/30 via-cyan-600/20 to-blue-950/40',
      content: parsedContent,
      raw_markdown: cleanMarkdown || parsedContent.join('\n\n'),
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      read_time: readTime,
      author_id: authorId,
      author_name: resolvedAuthorName,
      author_email: resolvedAuthorEmail,
      author_avatar: authorAvatar || '',
      status: 'PENDING_APPROVAL',
      views_count: 0,
    };

    const serverSupabase = createAdminClient();
    const { data, error } = await serverSupabase
      .from('blogs')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      // If table does not exist in schema, inform user clearly
      if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'The "blogs" table has not been created in Supabase yet. Please run the migration script in "apps/web/supabase/blogs-migration.sql" in your Supabase SQL Editor.',
            migrationRequired: true,
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Your blog has been submitted successfully and is currently under review by the Hacker’s Unity moderation team!',
      blog: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while saving blog' },
      { status: 500 }
    );
  }
}
