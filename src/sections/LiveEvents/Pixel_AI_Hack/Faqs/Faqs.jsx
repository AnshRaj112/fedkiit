"use client";

import React from "react";
import styles from "./styles/Faqs.module.scss";
import faqs from "../../../../data/liveEvents/Pixel_AI_Hack/Pixel_AI_Hack.json";
import Accordion from "../../../../components/LiveEvents/Accordian/Accordian";

const Faqs = () => {
    return (
        <div className={styles.container}>
            <Accordion data={faqs} />
        </div>
    );
};

export default Faqs;