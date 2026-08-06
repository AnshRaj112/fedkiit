"use client";

import { AnimatedBox } from "../../../assets/animations/AnimatedBox";
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

  return (
    <section className={styles.container} aria-labelledby="about-heading">
      <header className={styles.heading}>
        <h2 id="about-heading" className={styles.head}>
          ABOUT <span className={styles.accent}>US</span>
        </h2>
        <div className={styles.bottomLine} aria-hidden="true" />
        <p className={styles.subhead}>
          Who we are, how we lead, and what we build together.
        </p>
      </header>

      <div className={styles.stack}>
        {blocks.map((block, index) => (
          <AnimatedBox key={block.key} direction={block.reverse ? "left" : "right"}>
            <article
              className={`${styles.row} ${block.reverse ? styles.rowReverse : ""}`}
            >
              <div className={styles.media}>
                <img src={block.image} alt={block.alt} loading="lazy" />
              </div>
              <div className={styles.copy}>
                <span className={styles.index}>0{index + 1}</span>
                <h3 className={styles.boxhead}>
                  <span className={styles.accent}>{block.accent}</span> {block.title}
                </h3>
                <p className={styles.body}>{block.body}</p>
              </div>
            </article>
          </AnimatedBox>
        ))}
      </div>
    </section>
  );
}
