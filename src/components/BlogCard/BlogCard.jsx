"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './styles/BlogCard.module.scss';
import { Blurhash } from "react-blurhash";

function BlogCard(props) {
  const { data, customButtons, expandDescription = false, hideDescription = false, onClick, cardType = 'default' } = props;

  let processedData = data;

  if (typeof data === 'string') {
    try {
      processedData = JSON.parse(data);
    } catch (err) {
      console.error('Error parsing blog data in card:', err, 'Raw data:', data);
      processedData = {};
    }
  } else if (!data) {
    processedData = {};
  }

  const titleRef = useRef(null);
  const id = processedData.id || processedData._id;
  const title = processedData.title || processedData.blogTitle || 'Untitled Blog';
  const desc = processedData.desc || processedData.blogContent || processedData.blogSubtitle || '';
  const image = processedData.image || processedData.blogImage || 'https://via.placeholder.com/300x180';
  const date = processedData.date || processedData.blogDate || new Date().toISOString();
  const author = processedData.author || processedData.blogAuthor || { name: "Unknown", department: "N/A" };
  const summary = processedData.summary || processedData.metaDescription || desc;
  const blogLink = processedData.blogLink || processedData.mediumLink || 'https://medium.com/@fedkiit';

  let parsedAuthor = { name: "Unknown", department: "N/A" };

  try {
    if (typeof author === 'string') {
      if (author.startsWith('{') && author.endsWith('}')) {
        parsedAuthor = JSON.parse(author);
      } else {
        parsedAuthor = { name: author, department: "" };
      }
    } else if (typeof author === 'object' && author !== null) {
      parsedAuthor = author;
      if (!parsedAuthor.department && parsedAuthor.dept) {
        parsedAuthor.department = parsedAuthor.dept;
      }
    }

    if ((!parsedAuthor.department || parsedAuthor.department === "N/A") && processedData.authorDepartment) {
      parsedAuthor.department = processedData.authorDepartment;
    }

    if ((!parsedAuthor.department || parsedAuthor.department === "N/A") && processedData.authorDetails) {
      const authorDetails = typeof processedData.authorDetails === 'string'
        ? JSON.parse(processedData.authorDetails)
        : processedData.authorDetails;

      if (authorDetails?.department) {
        parsedAuthor.department = authorDetails.department;
      } else if (authorDetails?.dept) {
        parsedAuthor.department = authorDetails.dept;
      }
    }
  } catch (err) {
    console.error('Error handling author data:', err);
  }

  const getTruncatedTitle = (titleText) => {
    if (!titleText) return '';
    if (cardType === 'default') {
      const charLimit = 20;
      return titleText.length <= charLimit ? titleText : titleText.slice(0, charLimit) + '...';
    }

    const words = titleText.split(' ');
    let wordLimit = 4;
    if (cardType === 'recent' || props.isRecentCard) wordLimit = 9;
    else if (cardType === 'trending') wordLimit = 3;

    return words.length <= wordLimit ? titleText : words.slice(0, wordLimit).join(' ') + '...';
  };

  const handleReadMore = (e) => {
    e.stopPropagation();
    window.open(blogLink, '_blank');
  };

  const getCardClass = () => {
    let cardClass = styles.card;
    if (expandDescription) cardClass += ``;
    if (props.isRecentCard) cardClass += ` ${styles.recentCard}`;
    if (cardType === 'recent') cardClass += ` ${styles.recentCard}`;
    if (cardType === 'trending') cardClass += ` ${styles.trendingCard}`;
    if (cardType === 'default') cardClass += ` ${styles.defaultCard}`;
    return cardClass;
  };

  // Blurhash logic
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div className={getCardClass()} style={{ cursor: 'default' }}>
      <div className={styles.imageWrapper} onClick={() => window.open(blogLink, '_blank')} style={{ cursor: 'pointer' }}>
        {!isImageLoaded && (
          <Blurhash
            hash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
            width="100%"
            height="180px"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        )}
        <img
          className={styles.banner}
          src={image}
          alt={title}
          style={{ display: isImageLoaded ? 'block' : 'none' }}
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title} ref={titleRef} title={title}>
            {getTruncatedTitle(title)}
          </h2>
          <p className={styles.date}>
            {date ? (() => {
              const dateObj = new Date(date);
              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const year = dateObj.getFullYear();
              return `${day}-${month}-${year}`;
            })() : 'Invalid Date'}
          </p>
        </div>
        <p className={styles.author}>
          By <strong>{parsedAuthor.name}</strong>
        </p>
        {!hideDescription && (
          <div className={styles.summaryWrapper}>
            <p className={styles.summary}>{summary}</p>
          </div>
        )}
        {!hideDescription && (
          <span
            className={styles.readMore}
            onClick={handleReadMore}
            role="button"
            tabIndex={0}
            style={{ marginLeft: '0', display: 'inline-block', marginBottom: '0.5rem' }}
            onKeyPress={e => { if (e.key === 'Enter') handleReadMore(e); }}
          >
            Read More
          </span>
        )}
        {customButtons && (
          <div className={styles.customButtons}>
            {customButtons}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogCard;
