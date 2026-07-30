"use client";


import { motion } from 'framer-motion';
import style from "./styles/Attend.module.scss";

function Card({ title }) {
  return (
    <motion.div
      className={style.card}
      initial={{ opacity: 0, y: 50, scale: 0.5 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      <div className={style.card_content}>
        <h2>{title}</h2>
      </div>
    </motion.div>
  );
}

function Attend() {
  return (
    <>
      <div className={style.main}>
        <div className={style.topic}>
          <div className={style.why}>WHY ATTEND  <span style={{color:"#FFD389"}}> THIS SESSION </span></div>
        </div>

        <div className={style.boxmain}>
          <Card title="Innovate with AI & Design Thinking" />
          <Card title="Hands-on Workshops & Learning" />
          <Card title="Networking & Collaboration" />
          <Card title="Real-World Problem Solving" />
          <Card title="Competitive Edge" />
          <Card title="Entrepreneurial Insights" />
        </div>
      </div>

      <div className={style.circle1}></div>
      <div className={style.circle2}></div>
    </>
  );
}

export default Attend;
