import styles from './Header.module.css'

export default function Header({ totalSkills }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>◆</div>
          <div>
            <div className={styles.name}>Skill Marketplace</div>
            <div className={styles.sub}>Company-approved Claude skills</div>
          </div>
        </div>
        <div className={styles.right}>
          <span className={styles.stat}><strong>{totalSkills}</strong> skills</span>
          <a
            href="https://github.com/your-org/skill-hub/issues/new?template=plugin_submission.yml"
            target="_blank"
            rel="noreferrer"
            className={styles.submitBtn}
          >
            Submit a skill
          </a>
        </div>
      </div>
    </header>
  )
}
