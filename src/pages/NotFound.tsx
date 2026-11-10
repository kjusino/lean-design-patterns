import { href } from '../router'

export function NotFound() {
  return (
    <article className="prose-page">
      <h1>No pattern here</h1>
      <p>
        This address does not match any page. <a href={href('/')}>See all 23 patterns</a>.
      </p>
    </article>
  )
}
