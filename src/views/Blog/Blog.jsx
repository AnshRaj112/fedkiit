"use client";

import React, { useEffect, useState, useRef } from "react";

import { Search } from "lucide-react";
import styles from "./styles/Blog.module.scss";
import { api } from "../../services";
import { ComponentLoading } from "../../microInteraction";
import BlogCard from "../../components/BlogCard/BlogCard";
import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";

const Blog = () => {
  // state
  const router = useRouter();
  const filterRef = useRef(null);
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [departments, setDepartments] = useState(["All"]);
  const [showAllBlogs, setShowAllBlogs] = useState(false);

  // filter icon
  const GradientFilterIcon = () => (
    <svg width="36" height="28" viewBox="0 0 512 512" fill="none">
      <defs>
        <linearGradient id="filterGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F44336" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>
      <path
        d="M96 96h320L288 288v128l-64 32V288L96 96z"
        fill="none"
        stroke="url(#filterGradient)"
        strokeWidth="35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/api/blog/getBlog");
        if (response.status === 200) {
          const blogData = response.data.blogs || [];
          let processedBlogs = [];

          if (typeof blogData === "string") {
            try {
              processedBlogs = JSON.parse(blogData);
            } catch {
              processedBlogs = [];
            }
          } else if (Array.isArray(blogData)) {
            processedBlogs = blogData.map((blog) => ({
              id: blog.id || blog._id,
              title: blog.title || blog.blogTitle || "Untitled Blog",
              desc: blog.desc || blog.metaDescription || blog.blogContent || "",
              image:
                blog.image ||
                blog.blogImage ||
                "https://via.placeholder.com/400x200",
              date: blog.date || blog.blogDate || new Date().toISOString(),
              author:
                blog.author ||
                blog.blogAuthor ||
                '{"name":"Unknown","department":"N/A"}',
              blogLink: blog.blogLink || blog.mediumLink || "",
              visibility: blog.visibility === "private" ? "private" : "public",
              approval: blog.approval === false ? false : true,
              summary: blog.summary || blog.metaDescription || "",
              likes: blog.likes || 0,
              comments: blog.comments || [],
              readTime: blog.readTime || Math.ceil(Math.random() * 15) + 3,
            }));
          }

          setBlogs(processedBlogs);

          const uniqueDepts = new Set();
          processedBlogs.forEach((blog) => {
            try {
              const authorObj =
                typeof blog.author === "string"
                  ? JSON.parse(blog.author)
                  : blog.author;
              if (authorObj.department) uniqueDepts.add(authorObj.department);
            } catch { }
          });
          setDepartments(["All", ...Array.from(uniqueDepts)]);
        } else {
          setError("Failed to fetch blogs");
        }
      } catch {
        setError("An error occurred while fetching blogs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  //outside click for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // filter logic
  const filteredBlogs = blogs
    .filter((blog) => {
      let authorObj;
      try {
        authorObj =
          typeof blog.author === "string"
            ? JSON.parse(blog.author)
            : blog.author;
      } catch {
        authorObj = { department: null, name: "" };
      }
      return selectedDepartment === "All"
        ? true
        : authorObj.department === selectedDepartment;
    })
    .filter((blog) => {
      const titleMatch = blog.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const descMatch = blog.desc
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      let authorName = "";
      try {
        const authorObj =
          typeof blog.author === "string"
            ? JSON.parse(blog.author)
            : blog.author;
        authorName = authorObj?.name || "";
      } catch { }
      const authorMatch = authorName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return titleMatch || descMatch || authorMatch;
    })
    .filter((blog) => blog.visibility !== "private" && blog.approval !== false)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // blog sections
  const recentBlogs = filteredBlogs.slice(0, 1);
  const trendingBlogs = filteredBlogs.slice(1, 2);
  const featuredBlogs = filteredBlogs.slice(3, 6);

  // handle blog click
  const handleBlogClick = (id) => {
    const selectedBlog = blogs.find((b) => b.id === id);
    if (selectedBlog && selectedBlog.blogLink) {
      window.open(selectedBlog.blogLink, "_blank");
    }
  };

  // rendering
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.searchWrapper}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search Blogs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.filterWrapper} ref={filterRef}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={styles.filterButton}
            >
              <GradientFilterIcon />
            </button>

            {showFilter && (
              <ul className={styles.dropdown}>
                {departments.map((dept, i) => (
                  <li
                    key={i}
                    className={`${styles.dropdownItem} ${selectedDepartment === dept ? styles.activeItem : ""
                      }`}
                    onClick={() => {
                      setSelectedDepartment(dept);
                      setShowFilter(false);
                    }}
                  >
                    {dept}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className={styles.blogContainer}>
        {isLoading ? (
          <ComponentLoading />
        ) : searchQuery !== "" || showAllBlogs ? (
          <>
            {filteredBlogs.length > 0 ? (
              <div
                className={`${styles.featuredGrid} ${searchQuery !== "" || showAllBlogs ? styles.searchGrid : ""
                  }`}
              >
                {filteredBlogs.map((blog) => (
                  <div key={blog.id} className={styles.featuredCard}>
                    <BlogCard data={blog} cardType="default" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noBlogsFound}>No Blog Found</div>
            )}
            <div className={styles.buttonWrapper}>
              <button
                className={styles.seeAllButton}
                onClick={() => {
                  setShowAllBlogs(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Go Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.topSection}>
              <section className={styles.recentlyAdded}>
                <h3>RECENTLY ADDED</h3>
                {recentBlogs.length > 0 ? (
                  <BlogCard data={recentBlogs[0]} cardType="recent" />
                ) : (
                  <div className={styles.noBlogsFound}>No Recent Blog</div>
                )}
              </section>
              <section className={styles.trendingBlogs}>
                <h3>TRENDING BLOGS</h3>
                <div>
                  {trendingBlogs.length > 0 ? (
                    <>
                      <div
                        key={trendingBlogs[0].id}
                        className={styles.trendingCard}
                      >
                        <BlogCard
                          data={trendingBlogs[0]}
                          hideDescription={true}
                          cardType="trending"
                        />
                      </div>
                      {filteredBlogs.length > 2 && (
                        <div
                          key={filteredBlogs[2].id}
                          className={styles.trendingCard}
                        >
                          <BlogCard
                            data={filteredBlogs[2]}
                            hideDescription={true}
                            cardType="trending"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.noBlogsFound}>No Trending Blogs</div>
                  )}
                </div>
              </section>
            </div>

            <section className={styles.featuredBlogs}>
              <h3>FEATURED THIS WEEK</h3>
              <div className={styles.featuredGrid}>
                {featuredBlogs.map((blog) => (
                  <div key={blog.id} className={styles.featuredCard}>
                    <BlogCard data={blog} cardType="default" />
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.buttonWrapper}>
              <button
                className={styles.seeAllButton}
                onClick={() => {
                  setShowAllBlogs(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                See All
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
