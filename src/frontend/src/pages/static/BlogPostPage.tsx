import { useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'
import { BlogCover } from '../../components/static/BlogCover'
import { pickLang } from '../../data/blogPosts'
import { useBlogPost } from '../../hooks/useBlogPosts'
import { useBlogEngagement } from '../../hooks/useBlogEngagement'
import { useLanguage } from '../../contexts/LanguageContext'
import type { LandingTranslations } from '../../i18n/landing'

function ShareBar({ title, t }: { title: string; t: LandingTranslations }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const shareLinks = [
    {
      label: 'LinkedIn',
      icon: 'fa-brands fa-linkedin-in',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'X / Twitter',
      icon: 'fa-brands fa-x-twitter',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      label: 'WhatsApp',
      icon: 'fa-brands fa-whatsapp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
  ]

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="static-blog-share">
      <span className="static-blog-share-label">{t.blog.share}</span>
      {shareLinks.map(link => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="static-blog-share-btn"
          aria-label={`${t.blog.shareOn} ${link.label}`}
          title={`${t.blog.shareOn} ${link.label}`}
        >
          <i className={link.icon} />
        </a>
      ))}
      <button type="button" className="static-blog-share-btn" onClick={handleCopyLink} aria-label={t.blog.copyLink} title={t.blog.copyLink}>
        <i className={copied ? 'fa-solid fa-check' : 'fa-solid fa-link'} />
      </button>
      {copied && <span className="static-blog-share-copied">{t.blog.linkCopied}</span>}
    </div>
  )
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { post, posts } = useBlogPost(slug)
  const { liked, likeCount, viewCount, comments, toggleLike, addComment } = useBlogEngagement(slug ?? '')
  const [author, setAuthor] = useState('')
  const [message, setMessage] = useState('')
  const { language, t } = useLanguage()
  const locale = language === 'pt' ? 'pt-PT' : 'en-US'

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const title = pickLang(post.title, language)
  const excerpt = pickLang(post.excerpt, language)
  const category = pickLang(post.category, language)
  const content = pickLang(post.content, language)
  const readTime = pickLang(post.readTime, language)

  const related = (posts || []).filter(p => p.slug !== post.slug && p.category.pt === post.category.pt).slice(0, 2)

  function handleSubmitComment(e: FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    addComment(author, message)
    setMessage('')
  }

  return (
    <StaticPageLayout
      badge={category}
      title={title}
      desc={excerpt}
    >
      <div className="static-blog-post-meta">
        <span>{post.author}</span>
        <span>·</span>
        <span>{post.date}</span>
        <span>·</span>
        <span>{readTime} {t.blog.readTimeSuffix}</span>
        <span>·</span>
        <span><i className="fa-solid fa-eye" /> {viewCount.toLocaleString(locale)} {t.blog.views}</span>
      </div>

      <BlogCover icon={post.coverIcon} gradient={post.coverGradient} className="static-blog-post-cover" />

      <div className="static-blog-post-body">
        {content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="static-blog-post-actions">
        <button
          type="button"
          className={`static-blog-like-btn${liked ? ' is-liked' : ''}`}
          onClick={toggleLike}
          aria-pressed={liked}
        >
          <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
          {likeCount.toLocaleString(locale)} {t.blog.likes}
        </button>
        <ShareBar title={title} t={t} />
      </div>

      <section className="static-blog-comments">
        <h2>{comments.length} {comments.length === 1 ? t.blog.comment : t.blog.comments}</h2>

        <form className="static-blog-comment-form" onSubmit={handleSubmitComment}>
          <input
            type="text"
            placeholder={t.blog.namePlaceholder}
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="static-blog-comment-input"
          />
          <textarea
            placeholder={t.blog.messagePlaceholder}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="static-blog-comment-textarea"
            rows={3}
            required
          />
          <button type="submit" className="l-btn l-btn-primary l-btn-sm">{t.blog.submitComment}</button>
        </form>

        <div className="static-blog-comment-list">
          {comments.length === 0 && (
            <p className="static-blog-comment-empty">{t.blog.noComments}</p>
          )}
          {comments.slice().reverse().map(comment => (
            <div className="static-blog-comment" key={comment.id}>
              <div className="static-blog-comment-avatar">{comment.author.charAt(0).toUpperCase()}</div>
              <div className="static-blog-comment-content">
                <div className="static-blog-comment-head">
                  <strong>{comment.author}</strong>
                  <span>{new Date(comment.createdAt).toLocaleDateString(locale)}</span>
                </div>
                <p>{comment.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="static-blog-related">
          <h2>{t.blog.relatedArticles}</h2>
          <div className="static-blog-grid">
            {related.map(p => (
              <Link to={`/blog/${p.slug}`} className="static-blog-card" key={p.slug}>
                <BlogCover icon={p.coverIcon} gradient={p.coverGradient} />
                <div className="static-blog-card-body">
                  <span className="static-blog-category">{pickLang(p.category, language)}</span>
                  <h3>{pickLang(p.title, language)}</h3>
                  <p>{pickLang(p.excerpt, language)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="static-blog-back"><Link to="/blog" className="static-inline-link"><i className="fa-solid fa-arrow-left" /> {t.blog.backToBlog}</Link></p>
    </StaticPageLayout>
  )
}
