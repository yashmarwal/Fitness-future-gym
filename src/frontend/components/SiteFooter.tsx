import Link from "next/link";
import Image from "next/image";
import WhatsAppIcon from "@/frontend/components/icons/WhatsAppIcon";
import InstagramIcon from "@/frontend/components/icons/InstagramIcon";
import { INSTAGRAM_GYM, INSTAGRAM_VAIBHAV, INSTAGRAM_HRITIK } from "@/frontend/lib/siteConfig";

export default function SiteFooter() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-variant/60 mt-auto pb-20 xl:pb-0">
      <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl lg:py-space-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <Image
                src="/logo.jpeg"
                alt="Fitness Future Gym Logo"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border border-primary-container/40"
              />
              <span className="font-headline-md text-headline-md uppercase tracking-wider text-on-surface">
                FITNESS FUTURE <span className="text-primary-container">GYM</span>
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
              Unvarnished, heavy-duty iron culture in the heart of Nangloi, Delhi. Built for lifters, conditioning athletes, and progressive overload discipline.
            </p>
            <div className="pt-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-semibold">
                8+ Years of Power &amp; Conditioning
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-title-sm text-title-sm uppercase tracking-wider text-on-surface border-b border-surface-variant/40 pb-space-2xs mb-space-xs">
              HQ &amp; Timings
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              KH.No.52, Shop No.5 Plot No.8-A, 18, near Rao Vihar, Rao Vihar, Nangloi, Delhi, 110041
            </p>
            <div className="mt-space-xs bg-surface-container p-space-sm rounded-xl border-l-2 border-primary-container">
              <p className="font-label-sm text-label-sm uppercase text-tertiary">Operational Hours</p>
              <p className="font-title-sm text-title-sm text-on-surface">Mon - Sat: 5–11 AM &amp; 4–11 PM</p>
              <p className="font-body-sm text-body-sm text-tertiary-fixed-dim">Sunday: Closed for Recovery</p>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-title-sm text-title-sm uppercase tracking-wider text-on-surface border-b border-surface-variant/40 pb-space-2xs mb-space-xs">
              Navigation
            </span>
            <div className="grid grid-cols-2 gap-space-2xs font-label-md text-label-md uppercase">
              <Link className="text-on-surface-variant hover:text-primary-container transition-colors py-space-2xs" href="/">Home</Link>
              <Link className="text-on-surface-variant hover:text-primary-container transition-colors py-space-2xs" href="/about">About Us</Link>
              <Link className="text-on-surface-variant hover:text-primary-container transition-colors py-space-2xs" href="/programs">Programs</Link>
              <Link className="text-on-surface-variant hover:text-primary-container transition-colors py-space-2xs" href="/membership">Membership</Link>
              <Link className="text-on-surface-variant hover:text-primary-container transition-colors py-space-2xs" href="/location">Location</Link>
              <Link className="text-on-surface-variant hover:text-primary-container transition-colors py-space-2xs" href="/calculator">Calculator</Link>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-title-sm text-title-sm uppercase tracking-wider text-on-surface border-b border-surface-variant/40 pb-space-2xs mb-space-xs">
              Direct Line
            </span>
            <div className="flex flex-col gap-space-xs">
              {/* One row per coach: name+phone (already a tap-to-call link)
                  on the left, WhatsApp/Instagram as small icon buttons on
                  the right of that SAME row — grouping by row makes it
                  obvious whose icon is whose without needing a corner
                  badge on every single icon, which is what made this a
                  wall of near-identical squares before. */}
              <div className="flex items-center justify-between gap-space-sm">
                <p className="font-body-sm text-body-sm text-tertiary">
                  Coach Vaibhav: <a href="tel:+919643526435" className="text-primary-container font-bold">+91 96435 26435</a>
                </p>
                <div className="flex items-center gap-space-2xs shrink-0">
                  <a aria-label="WhatsApp Coach Vaibhav" className="text-tertiary hover:text-primary-container transition-colors" href="https://wa.me/919643526435" target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                  <a aria-label="Coach Vaibhav on Instagram" className="text-tertiary hover:text-primary-container transition-colors" href={INSTAGRAM_VAIBHAV} target="_blank" rel="noreferrer">
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between gap-space-sm">
                <p className="font-body-sm text-body-sm text-tertiary">
                  Coach Hritik: <a href="tel:+918700978341" className="text-primary-container font-bold">+91 87009 78341</a>
                </p>
                <div className="flex items-center gap-space-2xs shrink-0">
                  <a aria-label="WhatsApp Coach Hritik" className="text-tertiary hover:text-primary-container transition-colors" href="https://wa.me/918700978341" target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                  <a aria-label="Coach Hritik on Instagram" className="text-tertiary hover:text-primary-container transition-colors" href={INSTAGRAM_HRITIK} target="_blank" rel="noreferrer">
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-tertiary">contact.fitnessfuture@gmail.com</p>
            <div className="flex items-center gap-space-sm mt-space-sm">
              <Link aria-label="Location" className="p-space-xs rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" href="/location">
                <span className="material-symbols-outlined text-title-md">location_on</span>
              </Link>
              <a
                aria-label="Fitness Future Gym on Instagram"
                className="p-space-xs rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                href={INSTAGRAM_GYM}
                target="_blank"
                rel="noreferrer"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-space-2xl pt-space-md border-t border-surface-variant/30 flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <p className="font-body-sm text-body-sm text-tertiary">
            © {new Date().getFullYear()} Fitness Future Gym. Nangloi, Delhi. All Rights Reserved. Built for Iron Athletes.
          </p>
          <div className="flex items-center gap-space-md">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              Powerlifting • Bodybuilding • Conditioning
            </span>
          </div>
        </div>

        <div className="mt-space-sm pt-space-sm border-t border-surface-variant/20 flex justify-center">
          <p className="font-body-sm text-body-sm text-tertiary-fixed-dim">
            Developed by{" "}
            <a
              href="https://wa.me/918595475007?text=Hello%2C%20I%E2%80%99m%20interested%20in%20developing%20a%20website."
              target="_blank"
              rel="noreferrer"
              className="text-primary-container hover:underline"
            >
              Yash Marwal
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
