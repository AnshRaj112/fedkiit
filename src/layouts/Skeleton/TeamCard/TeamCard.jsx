"use client";

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import skeletonStyles from './styles/TeamCard.module.scss';

const TeamCardSkeleton = ({ customStyles = {} }) => (
  <SkeletonTheme baseColor="#313131" highlightColor="#525252">
    <div className={skeletonStyles.skeletonDiv}>
      <div className={skeletonStyles.skeletonBack}>
        <Skeleton className={`${skeletonStyles.skeleton} ${customStyles.skeleton}`} />
      </div>
      <div className={skeletonStyles.skeletonBack2}>
        <Skeleton className={`${skeletonStyles.skeleton2} ${customStyles.skeleton2}`} />
      </div>
    </div>
  </SkeletonTheme>
);

export default TeamCardSkeleton;
