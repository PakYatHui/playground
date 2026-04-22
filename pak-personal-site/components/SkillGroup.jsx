export default function SkillGroup({ group }) {
  return (
    <article className="skill-card">
      <h3>{group.title}</h3>
      <ul className="skill-list">
        {group.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
