import Link from "next/link";
import ProjectCard from "../components/ProjectCard";
import SectionHeading from "../components/SectionHeading";
import SkillGroup from "../components/SkillGroup";
import {
  contactLinks,
  featuredProjects,
  navItems,
  roles,
  skillGroups
} from "./siteData";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="hero" id="top">
        <nav className="top-nav" aria-label="Primary navigation">
          <Link href="#top" className="brand">
            Pak Yat Hui
          </Link>
          <div className="nav-links">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <Link href="/downloads" className="nav-cta">
              Downloads
            </Link>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Electrical Engineering Portfolio</p>
            <h1>
              Embedded, digital, and electronics-focused engineering work with a
              practical testing mindset.
            </h1>
            <p className="hero-text">
              I am Pak Yat Hui, a Master of Electrical Engineering student at
              the University of Melbourne majoring in Electronic and Embedded
              Systems. My work centres on embedded systems, FPGA and digital
              design, electronics validation, and hardware-software integration.
            </p>
            <div className="hero-actions">
              <a href="#projects" className="button button-primary">
                View Projects
              </a>
              <a href="#contact" className="button button-secondary">
                Contact
              </a>
            </div>
          </div>

          <aside className="hero-panel" aria-label="Professional focus">
            <span className="panel-label">Current focus</span>
            <ul className="focus-list">
              {roles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
            <div className="hero-note">
              Seeking graduate opportunities across embedded systems,
              electronics, FPGA and digital design, testing and validation, and
              broader electrical engineering roles in Australia.
            </div>
          </aside>
        </div>
      </header>

      <section className="content-section" id="about">
        <SectionHeading
          eyebrow="About"
          title="Engineering work shaped by integration, debugging, and careful validation."
          description="This site is designed to help recruiters and engineering teams understand the type of work I have done, the tools I have used, and the areas where I am building depth."
        />
        <div className="about-grid">
          <article className="info-card">
            <h3>Profile</h3>
            <p>
              I am studying a Master of Electrical Engineering at the
              University of Melbourne, following a Bachelor of Science at the
              same university. My academic work and project experience have
              focused on electronic and embedded systems.
            </p>
          </article>
          <article className="info-card">
            <h3>How I work</h3>
            <p>
              I tend to contribute most strongly in projects that need clear
              technical documentation, methodical debugging, hardware-software
              coordination, and step-by-step validation from concept to working
              implementation.
            </p>
          </article>
          <article className="info-card">
            <h3>Role fit</h3>
            <p>
              My portfolio is aligned to graduate roles in embedded systems,
              electronics, FPGA or digital design, testing and validation, and
              practical engineering development teams that value careful build
              and verification work.
            </p>
          </article>
        </div>
      </section>

      <section className="content-section" id="projects">
        <SectionHeading
          eyebrow="Featured Projects"
          title="Selected work across hardware, control, digital systems, and engineering implementation."
          description="The project mix below prioritises roles and coursework with strong relevance to embedded systems, FPGA, electronics integration, testing, and technical delivery."
        />
        <div className="project-grid">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </section>

      <section className="content-section" id="skills">
        <SectionHeading
          eyebrow="Skills"
          title="Technical areas and tools used across study, project work, and structured experimentation."
          description="The list is intentionally conservative and focused on tools and topics directly supported by the source materials."
        />
        <div className="skill-grid">
          {skillGroups.map((group) => (
            <SkillGroup key={group.title} group={group} />
          ))}
        </div>
      </section>

      <section className="content-section" id="resume">
        <SectionHeading
          eyebrow="Resume"
          title="Resume access is reserved in the site structure."
          description="A dedicated download slot is included now so the public site can keep a stable document path once the final PDF is ready."
        />
        <div className="resume-card">
          <div>
            <h3>Pak_Yat_Hui_Resume.pdf</h3>
            <p>
              Resume download placeholder. The final PDF has not been attached
              to this build yet, so the public-facing button remains disabled in
              this MVP.
            </p>
          </div>
          <button className="button button-disabled" disabled aria-disabled="true">
            Resume Coming Soon
          </button>
        </div>
      </section>

      <section className="content-section" id="contact">
        <SectionHeading
          eyebrow="Contact"
          title="Direct contact and professional profile links."
          description="Public contact details are limited to confirmed information only."
        />
        <div className="contact-grid">
          {contactLinks.map((item) => (
            <article className="contact-card" key={item.label}>
              <span>{item.label}</span>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.value}
                </a>
              ) : (
                <p>{item.value}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>Pak Yat Hui</p>
        <p>
          Electrical Engineering portfolio site focused on embedded systems,
          digital design, electronics testing, and practical project work.
        </p>
        <p>
          Future project-space separation reserved for
          {" "}
          <span>pakinmelb.pakagent.dpdns.org</span>.
        </p>
      </footer>
    </main>
  );
}
