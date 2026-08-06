"use client";

import React, { useState, useEffect, Children } from "react";
import PropTypes from "prop-types";
import { Blurhash } from "react-blurhash";
import styles from "./styles/Carousel.module.scss";
import CarouselSkeleton from "../../layouts/Skeleton/Carousel/Carousel";

function Carousel({
  children,
  images,
  customStyles = {},
  showSkeleton = true,
}) {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isImageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const contentCount = images ? images.length : Children.count(children);

  useEffect(() => {
    if (!showSkeleton) {
      setIsLoading(false);
      return undefined;
    }
    const loadingTimeout = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(loadingTimeout);
  }, [showSkeleton]);

  useEffect(() => {
    if (!autoPlay || isLoading || contentCount <= 1) return undefined;
    const timeOut = setTimeout(() => {
      setCurrent((prev) => (prev === contentCount - 1 ? 0 : prev + 1));
    }, 2800);
    return () => clearTimeout(timeOut);
  }, [current, autoPlay, isLoading, contentCount]);

  if (isLoading && showSkeleton) {
    return <CarouselSkeleton className="hide_skeleton" />;
  }

  return (
    <div className={`${styles.carousel_outer} ${customStyles.carousel_outer || ""}`}>
      <div
        className={`${styles.carousel} ${customStyles.carousel || ""}`}
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
      >
        <div
          className={`${styles.carousel_wrapper} ${customStyles.carousel_wrapper || ""}`}
        >
          {images
            ? images.map((image, index) => (
                <div
                  key={index}
                  className={`${styles.carousel_card} ${
                    index === current ? styles.carousel_card_active : ""
                  } ${customStyles.carousel_card || ""} ${
                    index === current ? customStyles.carousel_card_active || "" : ""
                  }`}
                >
                  <div className={styles.image_container}>
                    {!isImageLoaded && (
                      <Blurhash
                        hash="LEG8_%els7NgM{M{RiNI*0IVog%L"
                        width="100%"
                        height="100%"
                        resolutionX={32}
                        resolutionY={32}
                        punch={1}
                        className={styles.blurhash}
                      />
                    )}
                    <img
                      className={`${styles.card_image} ${
                        customStyles.card_image || ""
                      } ${isImageLoaded ? styles.loaded : ""}`}
                      src={image.image}
                      alt={image.title || `Slide ${index + 1}`}
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                  {image.title ? (
                    <div
                      className={`${styles.card_overlay} ${
                        customStyles.card_overlay || ""
                      }`}
                    >
                      <h2
                        className={`${styles.card_title} ${
                          customStyles.card_title || ""
                        }`}
                      >
                        {image.title}
                      </h2>
                    </div>
                  ) : null}
                </div>
              ))
            : Children.map(children, (child, index) => (
                <div
                  key={index}
                  className={`${styles.carousel_card} ${
                    index === current ? styles.carousel_card_active : ""
                  } ${customStyles.carousel_card || ""} ${
                    index === current ? customStyles.carousel_card_active || "" : ""
                  }`}
                >
                  {child}
                </div>
              ))}

          <div
            className={`${styles.carousel_pagination} ${
              customStyles.carousel_pagination || ""
            }`}
            role="tablist"
            aria-label="Carousel pagination"
          >
            {Array.from({ length: contentCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.pagination_dot} ${
                  index === current ? styles.pagination_dot_active : ""
                } ${customStyles.pagination_dot || ""} ${
                  index === current ? customStyles.pagination_dot_active || "" : ""
                }`}
                onClick={() => setCurrent(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-selected={index === current}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Carousel.propTypes = {
  children: PropTypes.node,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      image: PropTypes.string.isRequired,
      title: PropTypes.string,
    })
  ),
  customStyles: PropTypes.object,
  showSkeleton: PropTypes.bool,
};

export default Carousel;
