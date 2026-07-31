import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'
import { BlogCover } from '../../components/static/BlogCover'
import { BLOG_POSTS, type BlogPost } from '../../data/blogPosts'
import { useBlogStats } from '../../hooks/useBlogEngagement'

function BlogCard({ post }: { post: BlogPost }) {
  const { likeCount, viewCount } = useBlogStats(post.slug)

  return (
    <Link to={`/blog/${post.slug}`} className="static-blog-card">
      <BlogCover icon={post.coverIcon} gradient={post.coverGradient} />
      <div className="static-blog-card-body">
        <span className="static-blog-category">{post.category}</span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="static-blog-meta">
          <span>{post.date} · {post.readTime} de leitura</span>
          <span className="static-blog-meta-stats">
            <span><i className="fa-solid fa-eye" /> {viewCount.toLocaleString('pt-PT')}</span>
            <span><i className="fa-solid fa-heart" /> {likeCount.toLocaleString('pt-PT')}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function BlogPage() {
  return (
    <StaticPageLayout
      badge="Blog"
      title="Novidades e boas práticas de manutenção"
      desc="Artigos sobre produto, indústria e boas práticas de gestão de manutenção, escritos pela equipa ManuGent."
      narrow={false}
    >
      <div className="static-blog-grid">
        {BLOG_POSTS.map(post => (
          <BlogCard post={post} key={post.slug} />
        ))}
      </div>
    </StaticPageLayout>
  )
}
