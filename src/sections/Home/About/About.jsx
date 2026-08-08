"use client";

import { motion } from "framer-motion";
import styles from "./styles/About.module.scss";

const blocks = [
  {
    key: "why",
    accent: "Why",
    title: "one should join FED?",
    body: "We aim to empower the next generation of entrepreneurs to innovate, lead, and transform the future.",
    image:
      "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/665730072a5e426c487dd8da_Frame%201000001327.svg",
    alt: "Illustration of community and growth",
    reverse: false,
  },
  {
    key: "how",
    accent: "How",
    title: "we stay ahead?",
    body: "Efficient leadership, strategic planning, and sustainable collaborations keep us at the foremost tiers.",
    image:
      "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/6657309f141df2159c9ffd32_vecteezy_3d-masculino-personaje-brazo-cruzado_24387905%202%20(1).svg",
    alt: "Illustration of a confident leader",
    reverse: true,
  },
  {
    key: "what",
    accent: "What",
    title: "we do in FED?",
    body: "We help startups and organize events that promote entrepreneurship and real business opportunities.",
    image:
      "https://uploads-ssl.webflow.com/663d299655b46de106de40d7/66573007b67d2331b166edba_image%20526.svg",
    alt: "Illustration of collaboration and events",
    reverse: false,
  },
];

export default function About() {
  return (
    <section className={styles.aboutSection} aria-label="About Us">
      <div className={styles.innerWrap}>
        <motion.header
          className={styles.heading}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 id="about-heading" className={styles.head}>
            ABOUT <span className={styles.accent}>US</span>
          </h2>
          <div className={styles.bottomLine} aria-hidden="true" />
          <p className={styles.subhead}>
            Who we are, how we lead, and what we build together.
          </p>
        </motion.header>

        <div className={styles.stack}>
          {blocks.map((block, index) => {
            const isEven = index % 2 === 1;
            const xInitial = isEven ? 70 : -70;

            return (
              <motion.article
                key={block.key}
                className={`${styles.row} ${block.reverse ? styles.rowReverse : ""}`}
                aria-labelledby={`about-${block.key}`}
                initial={{ opacity: 0, x: xInitial, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: index * 0.1 }}
              >
                <div className={styles.media}>
                  <img src={block.image} alt={block.alt} loading="lazy" />
                </div>
                <div className={styles.copy}>
                  <h3 id={`about-${block.key}`} className={styles.boxhead}>
                    <span className={styles.accent}>{block.accent}</span>{" "}
                    {block.title}
                  </h3>
                  <p className={styles.body}>{block.body}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
