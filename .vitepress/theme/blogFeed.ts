/**
 * The news feed behind "Latest from the blog" — one query, two callers.
 *
 * `blogPosts.data.ts` runs it at build time so the section is already in the
 * static HTML for crawlers and for the no-JS pass. `HomePage.vue` runs the exact
 * same query again on mount, because a VitePress data loader resolves once, at
 * build time, and then never again: three posts shipped after the last docs
 * deploy and the module went on advertising the state of the blog on the day the
 * site was built. The baked list stays as the fallback when the runtime call
 * fails, so the section degrades to stale rather than to empty.
 *
 * Keep this in a plain module, NOT in the `.data.ts` file. VitePress replaces a
 * data loader's client-side module with the serialised `data` export alone, so
 * anything else exported from there is unreachable in the browser.
 */

export interface BlogPostData {
  title: string
  slug: string
  excerpt: string
  cover_image: string | null
  created_at: string
  category: { name: string; slug: string } | null
}

const SUPABASE_URL = 'https://s1.fotohub.app'

// Supabase anon key. Public by design — it is already served to every browser
// inside the fotohub.app app bundle — and RLS is what decides which rows come
// back, not the key being secret. This query only ever sees published posts.
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcyOTI5NjQ5LCJleHAiOjE5MzA2MDk2NDl9.AJDcWyH-pMYRGhWJOLBTDr-HAOC0YduX7BdsCxphSJ0'

const QUERY = [
  'select=title,slug,excerpt,cover_image,created_at,category:blog_categories(name,slug)',
  'is_published=eq.true',
  'language=eq.en',
  'order=created_at.desc',
  'limit=5'
].join('&')

/** Newest published English posts, or `[]` on any failure. Never throws. */
export async function fetchLatestPosts(): Promise<BlogPostData[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${QUERY}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    })
    if (!res.ok) return []
    const rows = await res.json()
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}
