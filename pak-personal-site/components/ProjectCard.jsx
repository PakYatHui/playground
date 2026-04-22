export default function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <div className="project-topline">
        <h3>{project.title}</h3>
        <span>{project.period}</span>
      </div>
      <p>{project.summary}</p>
      <ul className="tag-list" aria-label={`${project.title} tags`}>
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </article>
  );
}
