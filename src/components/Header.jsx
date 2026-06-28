import styles from './Header.module.css'

export default function Header({ totalSkills }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>◆</span>
          </div>
          <div>
            <div className={styles.brandName}>Skill Hub</div>
            <div className={styles.brandSub}>Company-approved Claude skills</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navStat}>
            <strong>{totalSkills}</strong> approved skills
          </span>
          <a
            href="https://github.com/your-org/skill-hub/issues/new?template=skill_submission.md"
            target="_blank"
            rel="noreferrer"
            className={styles.submitBtn}
          >
            Submit a skill
          </a>
        </nav>
      </div>
    </header>
  )
}
