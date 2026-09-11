import { listAnnouncements, listFaqs, listBlogPosts } from "@/backend/services/admin/content";
import ContentManager from "@/frontend/components/admin/ContentManager";

export default async function AdminContentPage() {
  const [announcements, faqs, posts] = await Promise.all([listAnnouncements(), listFaqs(), listBlogPosts()]);

  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Content</h1>
      <ContentManager announcements={announcements} faqs={faqs} posts={posts} />
    </div>
  );
}
