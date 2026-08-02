"use client";

import { useEffect, useState } from "react";
import { SocialEmbed } from "../../components";
import linkedinlogo from "../../assets/images/SocialMedia/linkedinLogo.svg";
import instalogo from "../../assets/images/SocialMedia/instaLogo.svg";
import styles from "./styles/Social.module.scss";
import { ComponentLoading } from "../../microInteraction";
import { api } from "../../services";
import BlogCard from "../../components/BlogCard/BlogCard";

const Social = () => {
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get("/api/blog/getBlog");

        if (response.status === 200) {
          const processedBlogs = (response.data.blogs || [])
            .filter(
              (blog) =>
                blog.visibility !== "private" &&
                blog.approval !== false
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date));

          setBlogs(processedBlogs);
        }
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div className={styles.socialMcontainer}>
      <div className={styles.text}>
        <div className={styles.circleCenter}></div>
        <div className={styles.content}>
          Welcome to the social media page of <br />
          <div className={styles.fed}>
            <div className={styles.box} id={styles.box1}>
              <img
                className={styles.instalogo}
                src={instalogo.src}
                alt="Instagram Logo"
              />
              <span
                style={{
                  background: "var(--primary)",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                {" "}
                FED{" "}
              </span>
              <img
                className={styles.linkedinlogo}
                src={linkedinlogo.src}
                alt="LinkedIn Logo"
              />
            </div>
          </div>
          <br />
        </div>
      </div>
      <div className={styles.socialMedia}>
        <div className={styles.container}>
          <div className={styles.leftColumn}>
            <div className={styles.sidebyside}>
              <div className={styles.instagramfeed}>
                <SocialEmbed type="instagramTopPost" />
              </div>
              <div className={styles.instagramfeed2}>
                <SocialEmbed type="instagramBottomPost" />
                <div className={styles.circle}></div>
              </div>
            </div>
          </div>
          <div className={styles.centerColumn}>
            <div className={styles.instagramreel}>
              <SocialEmbed type="instagramReel" />
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.linkedinfeed}>
              <div className={styles.circle1}></div>
              <SocialEmbed type="linkedInPost" />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.blogSection}>
        <h2>Latest Blogs</h2>

        {loadingBlogs ? (
          <ComponentLoading />
        ) : (
          <div className={styles.blogGrid}>
            {blogs.slice(0, 3).map((blog) => (
              <BlogCard
                key={blog.id || blog._id}
                data={blog}
                cardType="recent"
                hideDescription={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;