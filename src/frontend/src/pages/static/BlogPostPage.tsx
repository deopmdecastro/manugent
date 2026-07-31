import { useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'
import { BlogCover } from '../../components/static/BlogCover'
import { BLOG_POSTS, getBlogPostBySlug } from '../../data/blogPosts'
import { useBlogEngagement } from '../../hooks/useBlogEngagement'

function ShareBar({ title }: { title: string }) {
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
      <span className="static-blog-share-label">Partilhar</span>
      {shareLinks.map(link => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="static-blog-share-btn"
          aria-label={`Partilhar no ${link.label}`}
          title={`Partilhar no ${link.label}`}
        >
          <i className={link.icon} />
        </a>
      ))}
      <button type="button" className="static-blog-share-btn" onClick={handleCopyLink} aria-label="Copiar link" title="Copiar link">
        <i className={copied ? 'fa-solid fa-check' : 'fa-solid fa-link'} />
      </button>
      {copied && <span className="static-blog-share-copied">Link copiado!</span>}
    </div>
  )
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = getBlogPostBySlug(slug)
  const { liked, likeCount, viewCount, comments, toggleLike, addComment } = useBlogEngagement(slug ?? '')
  const [author, setAuthor] = useState('')
  const [message, setMessage] = useState('')

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const related = BLOG_POSTS.filter(p => p.slug !== post.slug && p.category === post.category).slice(0, 2)

  function handleSubmitComment(e: FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    addComment(author, message)
    setMessage('')
  }

  return (
    <StaticPageLayout
      badge={post.category}
      title={post.title}
      desc={post.excerpt}
    >
      <div className="static-blog-post-meta">
        <span>{post.author}</span>
        <span>·</span>
        <span>{post.date}</span>
        <span>·</span>
        <span>{post.readTime} de leitura</span>
        <span>·</span>
        <span><i className="fa-solid fa-eye" /> {viewCount.toLocaleString('pt-PT')} visualizações</span>
      </div>

      <BlogCover icon={post.coverIcon} gradient={post.coverGradient} className="static-blog-post-cover" />

      <div className="static-blog-post-body">
        {post.content.map((paragraph, i) => (
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
          {likeCount.toLocaleString('pt-PT')} gostos
        </button>
        <ShareBar title={post.title} />
      </div>

      <section className="static-blog-comments">
        <h2>{comments.length} comentário{comments.length === 1 ? '' : 's'}</h2>

        <form className="static-blog-comment-form" onSubmit={handleSubmitComment}>
          <input
            type="text"
            placeholder="O teu nome (opcional)"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="static-blog-comment-input"
          />
          <textarea
            placeholder="Escreve um comentário..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="static-blog-comment-textarea"
            rows={3}
            required
          />
          <button type="submit" className="l-btn l-btn-primary l-btn-sm">Comentar</button>
        </form>

        <div className="static-blog-comment-list">
          {comments.length === 0 && (
            <p className="static-blog-comment-empty">Sê o primeiro a comentar este artigo.</p>
          )}
          {comments.slice().reverse().map(comment => (
            <div className="static-blog-comment" key={comment.id}>
              <div className="static-blog-comment-avatar">{comment.author.charAt(0).toUpperCase()}</div>
              <div className="static-blog-comment-content">
                <div className="static-blog-comment-head">
                  <strong>{comment.author}</strong>
                  <span>{new Date(comment.createdAt).toLocaleDateString('pt-PT')}</span>
                </div>
                <p>{comment.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="static-blog-related">
          <h2>Artigos relacionados</h2>
          <div className="static-blog-grid">
            {related.map(p => (
              <Link to={`/blog/${p.slug}`} className="static-blog-card" key={p.slug}>
                <BlogCover icon={p.coverIcon} gradient={p.coverGradient} />
                <div className="static-blog-card-body">
                  <span className="static-blog-category">{p.category}</span>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="static-blog-back"><Link to="/blog" className="static-inline-link"><i className="fa-solid fa-arrow-left" /> Voltar ao blog</Link></p>
    </StaticPageLayout>
  )
}
