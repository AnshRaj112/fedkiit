"use client";

import { useState, useRef, useEffect} from "react";
import styles from "./styles/Feedback.module.scss";
import feedbackData from "../../../data/Feedback.json";
import quoteImg from "../../../assets/images/quote.png";

const Feedback = () => {
  const feedbacksRef = useRef(null);

  const FeedbackCard = ({ quote }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
    };

    const truncatedQuote = quote.quote.length > 200 
      ? `${quote.quote.substring(0, 160)}...` 
      : quote.quote;

    return (
      <div className={styles.feedbackCard}>
        <div className={styles.FeedbackMsg} onClick={toggleExpand}>
          <p className={styles.feedbackText}>
            {isExpanded ? quote.quote : truncatedQuote}
            {quote.quote.length > 160 && !isExpanded && (
              <span className={styles.readMore} style={{fontWeight:"550", cursor:"pointer", color:"whitesmoke"}}>read more</span>
            )}
          </p>
        </div>

        <div>
          <p className={styles.feedbackAuthor}>{quote.title}</p>
          <p className={styles.feedbackEv}>{quote.post}</p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const feedbacksContainer = feedbacksRef.current;
    const handleMouseEnter = () => {
      feedbacksContainer.style.animationPlayState = "paused";
    };
    const handleMouseLeave = () => {
      feedbacksContainer.style.animationPlayState = "running";
    };

    feedbacksContainer.addEventListener("mouseenter", handleMouseEnter);
    feedbacksContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      feedbacksContainer.removeEventListener("mouseenter", handleMouseEnter);
      feedbacksContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className={styles.feedbackContainer}>
      <img className={styles.upQuote} src={quoteImg.src} alt="Up Quote" />
      <div className={styles.heading}>
        <h2>
          TESTIMO<span>NIALS</span>
        </h2>
        <div className={styles.bottomLine}></div>
      </div>
      <div className={styles.feedbacksContainer}>
        <div className={styles.feedbacks} ref={feedbacksRef}>
          {feedbackData.concat(feedbackData).map((quote, index) => (
            <FeedbackCard key={index} quote={quote} />
          ))}
        </div>
      </div>
      <img className={styles.downQuote} src={quoteImg.src} alt="Down Quote" />
    </div>
  );
};

export default Feedback;
