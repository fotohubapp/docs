import { defineLoader } from 'vitepress'
import { fetchLatestPosts, type BlogPostData } from './blogFeed'

export type { BlogPostData }

declare const data: BlogPostData[]
export { data }

/**
 * Build-time snapshot of the news feed. This is the SSG fallback only — the list
 * a visitor actually sees is refetched on mount in HomePage.vue, because this
 * loader resolves once per build and the blog ships more often than the docs do.
 * See `blogFeed.ts`.
 */
export default defineLoader({
  load: (): Promise<BlogPostData[]> => fetchLatestPosts()
})
