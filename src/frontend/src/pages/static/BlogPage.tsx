import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'
import { BlogCover } from '../../components/static/BlogCover'
import { pickLang, type BlogPost } from '../../data/blogPosts'
import { useBlogPosts } from '../../hooks/useBlogPosts'
import { useBlogStats } from '../../hooks/useBlogEngagement'
import { useLanguage } from '../../contexts/LanguageContext'

function BlogCard({ post }: { post: BlogPost }) {
  const { likeCount, viewCount } = useBlogStats(post.slug)
  const { language, t } = useLanguage()
  const locale = language === 'pt' ? 'pt-PT' : 'en-US'

  return (
    <Link to={`/blog/${post.slug}`} className="static-blog-card">
      <BlogCover icon={post.coverIcon} gradient={post.coverGradient} />
      <div className="static-blog-card-body">
        <span className="static-blog-category">{pickLang(post.category, language)}</span>
        <h3>{pickLang(post.title, language)}</h3>
        <p>{pickLang(post.excerpt, language)}</p>
        <div className="static-blog-meta">
          <span>{post.date} · {pickLang(post.readTime, language)} {t.blog.readTimeSuffix}</span>
          <span className="static-blog-meta-stats">
            <span><i className="fa-solid fa-eye" /> {viewCount.toLocaleString(locale)}</span>
            <span><i className="fa-solid fa-heart" /> {likeCount.toLocaleString(locale)}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function BlogPage() {
  const { posts, error } = useBlogPosts()
  const { t } = useLanguage()

  return (
    <StaticPageLayout
      badge={t.blog.badge}
      title={t.blog.title}
      desc={t.blog.desc}
      narrow={false}
    >
      {error && <p className="static-blog-error">{error}</p>}
{!posts && !error && <p className="static-blog-loading">A carregar...</p>}
      <div className="static-blog-grid">
        {posts?.map(post => (
          <BlogCard post={post} key={post.slug} />
        ))}
      </div>
    </StaticPageLayout>
  )
}
