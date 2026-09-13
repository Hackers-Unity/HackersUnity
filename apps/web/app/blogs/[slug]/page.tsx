import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  User,
  Share2,
  BookOpen,
  Tag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blogs-data';

interface BlogSlugPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function BlogSlugPage({ params }: BlogSlugPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const post = BLOG_POSTS.find((b) => b.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const otherPosts = BLOG_POSTS.filter((b) => b.id !== post.id).slice(0, 3);

  return (
    <div className="flex-1 min-h-screen bg-slate-50/70 dark:bg-[#05070d] text-slate-900 dark:text-slate-100 selection:bg-[#0099e6] selection:text-white relative overflow-hidden py-12">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#f97316]/06 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Back Link */}
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#0099e6] dark:hover:text-[#0099e6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Blogs</span>
        </Link>

        {/* Article Container (Glassmorphism) */}
        <article className="rounded-3xl bg-white/80 dark:bg-[#090e17]/80 border border-slate-200/90 dark:border-white/[0.1] backdrop-blur-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/80 overflow-hidden relative">
          {/* Glowing Top Hairline */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316]" />

          {/* Header Banner */}
          <div className={`p-8 sm:p-12 bg-gradient-to-br ${post.coverGradient} border-b border-slate-200/60 dark:border-white/10 space-y-4`}>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/10">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-white/90 bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                <span>{post.readTime}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
              {post.subtitle}
            </p>
          </div>

          {/* Author Bar */}
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0099e6] to-sky-400 text-white font-black text-xs flex items-center justify-center shadow-md shadow-sky-500/20">
                {post.author.initials}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {post.author.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {post.author.role} • {post.publishedAt}
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-12 space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {post.content.map((paragraph, index) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3
                    key={index}
                    className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-4 pb-1 tracking-tight"
                  >
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <li key={index} className="ml-4 list-disc text-slate-600 dark:text-slate-300">
                    {paragraph.replace('- ', '')}
                  </li>
                );
              }
              return (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              );
            })}

            {/* Tags */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-slate-400" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* More Articles */}
        <div className="space-y-6 pt-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            More from Hacker&apos;s Unity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherPosts.map((item) => (
              <Link
                key={item.id}
                href={`/blogs/${item.slug}`}
                className="group p-5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-md hover:border-[#0099e6]/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-[#0099e6] uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#0099e6] transition-colors">
                    {item.title}
                  </h4>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{item.readTime}</span>
                  <span className="font-bold text-[#0099e6] group-hover:translate-x-1 transition-transform">
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
