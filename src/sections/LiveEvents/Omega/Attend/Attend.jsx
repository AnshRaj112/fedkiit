"use client";

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion';
import style from "./styles/Attend.module.scss";

function Card({ img, title }) {
  return (
    <motion.div
      className={style.card}
      initial={{ opacity: 0, y: 50, scale: 0.5 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      <div className={style.cut}></div>
      <div className={style.card_img}>
        <img src={img} alt="Event Image" />
      </div>
      <div className={style.card_content}>
        <h2>{title}</h2>
        <div className={style.cut2}></div>
      </div>
    </motion.div>
  );
}

function Attend() {
  return (
    <>
      <div className={style.main}>
        <div className={style.heading}>
          <div className={style.why}><h1>WHY ATTEND</h1></div>
          <div className={style.omega}><h1>OMEGA?</h1></div>
        </div>

        <div className={style.boxmain}>
          <Card img="https://cdn.prod.website-files.com/6891df87cfba687a7fd80202/6894c217368c50eb981ffb0f_bulb.png"  title="Inspiration and Knowledge" />
          <Card img="https://cdn.prod.website-files.com/6891df87cfba687a7fd80202/6894c23b7cf4455ecfb7006b_network.png" title="Networking Opportunities" />
          <Card img="https://cdn.prod.website-files.com/6891df87cfba687a7fd80202/6894c23b97a8cc5333a2cd8a_tools.png" title="Hands-on Experience" />
          <Card img="https://cdn.prod.website-files.com/6891df87cfba687a7fd80202/6894c23b4ecdb46153de2974_fire.png" title="Exposure and Recognition" />
        </div>
      </div>

     
    </>
  );
}

export default Attend;
