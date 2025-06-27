'use client'

import TextPressure from './ui/blocks/TextAnimations/TextPressure/TextPressure';
import Dock from './ui/blocks/Components/Dock/Dock';
import styles from "./ui/page.module.css";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section id="hero" className={`${styles.section} ${styles.hero}`}>
        <Dock collapsible={false} position="top" responsive="bottom"/>
        <main className={styles.main}>
          <p>See Say Learn</p>
          <div>
            <TextPressure
              text="Step by Step"
              flex={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="var(--text)"
              strokeColor="#ff0000"
              minFontSize={128}
            />
          </div>
          <p>Let children play useful games</p>
          <div className={styles.actionButtonContainer}>
            <button
              className={`${styles.button} ${styles.projectsButton}`}
              onClick={() => {
                router.push('/game'); // Navigate to the Start section
              }} // Navigate to the Start section}
            >
              Start
            </button>
             {/* <button className={`${styles.button} ${styles.cvButton}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "50px" }}>
                download
              </span>
              Button 2
            </button> */}
          </div>
        </main>
      </section>
      </div>
  );
}
