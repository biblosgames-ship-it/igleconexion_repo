// src/components/Header.tsx
import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" legacyBehavior>
        <a className={styles.logoLink}>
          <Image
            src="/Igleconexion logo.png"
            alt="Igleconexion"
            width={120}
            height={40}
            className={styles.logo}
          />
        </a>
      </Link>
      <nav className={styles.nav} aria-label="Navegación principal">
        <Link href="/info" legacyBehavior>
          <a className={styles.icon}>ℹ️</a>
        </Link>
        <Link href="/agenda" legacyBehavior>
          <a className={styles.icon}>📅</a>
        </Link>
        <Link href="/contacto" legacyBehavior>
          <a className={styles.icon}>📞</a>
        </Link>
        <Link href="/recursos" legacyBehavior>
          <a className={styles.icon}>📚</a>
        </Link>
      </nav>
    </header>
  );
}
