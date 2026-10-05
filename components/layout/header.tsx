import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { GithubIcon, LogoMark } from "@/components/ui/icons";
import { SITE } from "@/lib/config";

/** Wordmark on the left, Saved codes and GitHub on the right. Wraps neatly on phones. */
export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-5 sm:py-7">
      <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-lg text-[17px] font-semibold tracking-tight">
        <LogoMark size={22} />
        {SITE.name}
      </Link>
      <nav aria-label="Main" className="flex w-full gap-2 sm:w-auto">
        <ButtonLink href="/saved" variant="secondary" className="flex-1 sm:flex-none">
          Saved codes
        </ButtonLink>
        <ButtonLink
          href={SITE.repoUrl}
          external
          variant="primary"
          icon={<GithubIcon size={17} />}
          className="flex-1 sm:flex-none"
        >
          View on GitHub
        </ButtonLink>
      </nav>
    </header>
  );
}
