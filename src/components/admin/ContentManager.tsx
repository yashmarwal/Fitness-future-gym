"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Announcement, Faq, BlogPost } from "@/types/admin";

export default function ContentManager({
  announcements,
  faqs,
  posts,
}: {
  announcements: Announcement[];
  faqs: Faq[];
  posts: BlogPost[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"announcements" | "faqs" | "blog">("announcements");

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-surface-container-low w-fit">
        {(["announcements", "faqs", "blog"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-label text-xs uppercase tracking-wide px-4 py-2 ${
              tab === t ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "announcements" && <AnnouncementsTab items={announcements} onChange={() => router.refresh()} />}
      {tab === "faqs" && <FaqsTab items={faqs} onChange={() => router.refresh()} />}
      {tab === "blog" && <BlogTab items={posts} onChange={() => router.refresh()} />}
    </div>
  );
}

function AnnouncementsTab({ items, onChange }: { items: Announcement[]; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/content/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setTitle("");
    setBody("");
    onChange();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/content/announcements/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-3">
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
        <textarea
          required
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
        <button className="bg-primary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard w-fit">
          Publish
        </button>
      </form>
      {items.map((a) => (
        <div key={a.id} className="bg-surface-container p-4 flex justify-between items-start gap-4">
          <div>
            <p className="font-label text-sm uppercase text-on-surface">{a.title}</p>
            <p className="font-body text-xs text-tertiary mt-1">{a.body}</p>
          </div>
          <button onClick={() => handleDelete(a.id)} className="font-label text-[10px] uppercase text-error shrink-0">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

function FaqsTab({ items, onChange }: { items: Faq[]; onChange: () => void }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/content/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
    setQuestion("");
    setAnswer("");
    onChange();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/content/faqs/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-3">
        <input
          required
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
        <textarea
          required
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
        <button className="bg-primary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard w-fit">
          Add FAQ
        </button>
      </form>
      {items.map((f) => (
        <div key={f.id} className="bg-surface-container p-4 flex justify-between items-start gap-4">
          <div>
            <p className="font-label text-sm uppercase text-on-surface">{f.question}</p>
            <p className="font-body text-xs text-tertiary mt-1">{f.answer}</p>
          </div>
          <button onClick={() => handleDelete(f.id)} className="font-label text-[10px] uppercase text-error shrink-0">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

function BlogTab({ items, onChange }: { items: BlogPost[]; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await fetch("/api/admin/content/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, excerpt }),
    });
    setTitle("");
    setExcerpt("");
    onChange();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/content/blog/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-3">
        <input
          required
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
        <textarea
          placeholder="Excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
        <button className="bg-primary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard w-fit">
          Publish Post
        </button>
      </form>
      {items.map((p) => (
        <div key={p.id} className="bg-surface-container p-4 flex justify-between items-start gap-4">
          <div>
            <p className="font-label text-sm uppercase text-on-surface">{p.title}</p>
            <p className="font-body text-xs text-tertiary mt-1">{p.excerpt}</p>
          </div>
          <button onClick={() => handleDelete(p.id)} className="font-label text-[10px] uppercase text-error shrink-0">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
