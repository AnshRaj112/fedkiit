"use client";

import { AnimatedBox } from "../../../assets/animations/AnimatedBox";
import styles from './styles/About.module.scss';

function About() {
  return (
    <div className={styles.container}>
      <div className={styles.heading}>
      <p className={styles.head}>ABOUT <span style={{ background: "var(--primary)", WebkitBackgroundClip: "text", color: "transparent" }}>US</span></p>
      <div className={styles.bottomLine}></div>
      </div>
      
      <AnimatedBox direction="right">
        <div className={`${styles.box1} ${styles.boxflex}`}>
          <img className={styles.whyfedimg} src="https://uploads-ssl.webflow.com/663d299655b46de106de40d7/665730072a5e426c487dd8da_Frame%201000001327.svg" alt="" />
          <div className={`${styles.whyfed} ${styles.box}`}>
              <p className={styles.boxhead}><span style={{ background: "var(--primary)", WebkitBackgroundClip: "text", color: "transparent" }}>Why</span> one should join FED?</p>
            <div className={styles.boxinnertext}>
            <p>
            We aim to empower the  next generation of entrepreneurs 
            </p>
            <p>to innovate, lead, and transform the future.</p>
            </div>
          </div>
        </div>
      </AnimatedBox>
      <AnimatedBox direction="left">
        <div className={`${styles.box2} ${styles.boxflex}`}>
          <img className={styles.howfedimg} src="https://uploads-ssl.webflow.com/663d299655b46de106de40d7/6657309f141df2159c9ffd32_vecteezy_3d-masculino-personaje-brazo-cruzado_24387905%202%20(1).svg" alt="" />
          <div className={`${styles.howfed} ${styles.box}`}>
              <p className={styles.boxhead}><span style={{ background: "var(--primary)", WebkitBackgroundClip: "text", color: "transparent" }}>How</span> we are still on top?</p>
            <div className={styles.boxinnertext}>
            <p>Efficient leaderships, strategic planning and sustainable</p>
            <p>executive collaborations keeps us at foremost tiers.</p>
            </div>
          </div>
        </div>
      </AnimatedBox>
      <AnimatedBox direction="right">
        <div className={`${styles.box3} ${styles.boxflex}`}>
          <img className={styles.whatfedimg} src="https://uploads-ssl.webflow.com/663d299655b46de106de40d7/66573007b67d2331b166edba_image%20526.svg" alt="" />
          <div className={`${styles.whatfed} ${styles.box}`}>
              <p className={styles.boxhead}><span style={{ background: "var(--primary)", WebkitBackgroundClip: "text", color: "transparent" }}>What</span> we do in FED?</p>
            <div className={styles.boxinnertext}>
            <p>We help startups and organise events to promote</p>
            <p>entrepreneurships and business opportunities.</p> 
            </div>
          </div>
        </div>
      </AnimatedBox>
    </div>
  );
}

export default About;
