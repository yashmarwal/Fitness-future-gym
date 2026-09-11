export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="max-w-(--container-max) mx-auto px-gutter-mobile lg:px-gutter-desktop py-16 lg:py-24">
      <span className="font-label text-xs uppercase tracking-widest text-primary-container">
        Under Construction
      </span>
      <h1 className="font-display text-headline-lg-mobile lg:text-display-lg text-on-surface uppercase tracking-wide mt-2">
        {title}
      </h1>
      <p className="font-body text-tertiary mt-4 max-w-xl">
        This page is scaffolded but not yet built out.
      </p>
    </div>
  );
}
