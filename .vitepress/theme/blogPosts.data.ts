import { defineLoader } from 'vitepress'

const SUPABASE_URL = 'https://s1.fotohub.app'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcyOTI5NjQ5LCJleHAiOjE5MzA2MDk2NDl9.AJDcWyH-pMYRGhWJOLBTDr-HAOC0YduX7BdsCxphSJ0'

export interface BlogPostData {
  title: string
  slug: string
  excerpt: string
  cover_image: string | null
  created_at: string
  category: { name: string; slug: string } | null
}

declare const data: BlogPostData[]
export { data }

export default defineLoader({
  async load(): Promise<BlogPostData[]> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/blog_posts?select=title,slug,excerpt,cover_image,created_at,category:blog_categories(name,slug)&is_published=eq.true&language=eq.en&order=created_at.desc&limit=5`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      )
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }
})
