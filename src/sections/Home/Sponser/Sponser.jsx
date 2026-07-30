"use client";

import React, { useState, useEffect } from 'react';
import SponserImg from '../../../data/Sponser.json';
import styles from './styles/Sponser.module.scss';
import Carousel from '../../../components/Carousel/Carousel';
import SkeletonCard from '../../../layouts/Skeleton/Sponser/Sponser';
import { Blurhash } from 'react-blurhash';

const Sponser = () => {
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 480) {
        setItemsPerPage(6);
      } else {
        setItemsPerPage(12);
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);

    // Simulate loading time
    setTimeout(() => setLoading(false), 2000);

    return () => {
      window.removeEventListener('resize', updateItemsPerPage);
    };
  }, []);

  const groupSponserCards = () => {
    const groupedSponsers = [];
    for (let i = 0; i < SponserImg.length; i += itemsPerPage) {
      groupedSponsers.push(SponserImg.slice(i, i + itemsPerPage));
    }
    return groupedSponsers;
  };

  const SponserCard = ({ image }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    return (
      <div className={styles.sponser_card}>
        {!isImageLoaded && (
          <Blurhash
            hash="LEG8_%els7NgM{M{RiNI*0IVog%L"
            width={'100%'}
            height={'100%'}
            resolutionX={32}
            resolutionY={32}
            punch={1}
            className={styles.SponserCard_blurhash}
          />
        )}
        <img
          src={image.image}
          className={styles.SponserCard_image}
          alt={image.title}
          onLoad={() => setIsImageLoaded(true)}
          style={{ display: isImageLoaded ? 'block' : 'none' }}
        />
      </div>
    );
  };

  const groupedSponserCards = groupSponserCards();

  return (
    <>
      <div className={styles.sponser_title}>
        our <span className={styles.sponser_title2}>Sponsors</span>
      </div>
      <div className={styles.bottom_line}></div>
      <div className={styles.sponser_container}>
        <div className={styles.sponser_div}>
          <Carousel className={styles.customCarousel} customStyles={{ carousel_card: styles.customCarouselCard }} showSkeleton={false}>
            {groupedSponserCards.map((group, index) => (
              <div key={index} className={styles.sponser_all}>
                {group.map((image, idx) => (
                  loading ? <SkeletonCard key={idx} /> : <SponserCard key={idx} image={image} />
                ))}
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </>
  );
};

export default Sponser;
