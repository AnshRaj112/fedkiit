"use client";

import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import skeletonStyles from "./styles/Carousel.module.scss";

const CarouselSkeleton = ({ customStyles = {}, className = "" }) => (
  <SkeletonTheme baseColor="#525252" highlightColor="#313131">
    <div className={`${skeletonStyles.carousel_skeleton} ${className} ${customStyles.carousel_skeleton || ''}`}>
      <div className={`${skeletonStyles.inner_skeleton} ${customStyles.inner_skeleton || ''}`}>
        <div className={`${skeletonStyles.carousel_outer} ${customStyles.carousel_outer || ''}`}>
          <Skeleton className={`${skeletonStyles.carousel} ${customStyles.carousel || ''}`} />
        </div>
      </div>
    </div>
  </SkeletonTheme>
);

export default CarouselSkeleton;
