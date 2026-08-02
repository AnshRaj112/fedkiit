"use client";

// components/EventCardSkeleton.jsx

import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import style from "./styles/eventskeleton.module.scss";
import { SkeletonTheme } from "react-loading-skeleton";
import AnimatedBox from "../../../assets/animations/socialPageAnimation";

const EventCardSkeleton = ({ amount }) => {
  const loadCards = Array(amount).fill(1);

  return loadCards.map((_, i) => (
    // <AnimatedBox>
    <div  className={style.cardskeleton} key={i}>
      <SkeletonTheme baseColor="#313131" highlightColor="#525252">
        <Skeleton height={180} style={{ marginBottom: "1rem" }} />
        <Skeleton count={3} height={20} width="100%" style={{ marginBottom: "0.5rem" }} />
      </SkeletonTheme>
    </div>

  ));

};

export default EventCardSkeleton;
