import "server-only";
import { getDb } from "@/server/db/client";

export type Announcement = { id: string; title: string; body: string; isPublished: boolean; createdAt: string };
export type Faq = { id: string; question: string; answer: string; sortOrder: number };
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  tag: string | null;
  excerpt: string | null;
  body: string | null;
  isPublished: boolean;
  publishedAt: string;
};

export async function listAnnouncements(): Promise<Announcement[]> {
  const db = getDb();
  const { data, error } = await db
    .from("announcements")
    .select("id, title, body, is_published, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, title: r.title, body: r.body, isPublished: r.is_published, createdAt: r.created_at }));
}

export async function createAnnouncement(title: string, body: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("announcements").insert({ title, body });
  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listFaqs(): Promise<Faq[]> {
  const db = getDb();
  const { data, error } = await db.from("faqs").select("id, question, answer, sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, question: r.question, answer: r.answer, sortOrder: r.sort_order }));
}

export async function createFaq(question: string, answer: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("faqs").insert({ question, answer });
  if (error) throw new Error(error.message);
}

export async function deleteFaq(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("faqs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  const db = getDb();
  const { data, error } = await db
    .from("blog_posts")
    .select("id, title, slug, tag, excerpt, body, is_published, published_at")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    tag: r.tag,
    excerpt: r.excerpt,
    body: r.body,
    isPublished: r.is_published,
    publishedAt: r.published_at,
  }));
}

export async function createBlogPost(input: { title: string; slug: string; tag?: string; excerpt?: string; body?: string }): Promise<void> {
  const db = getDb();
  const { error } = await db.from("blog_posts").insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
