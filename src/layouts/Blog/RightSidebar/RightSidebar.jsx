"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles/RightSidebar.module.scss";
import { FaExternalLinkAlt } from 'react-icons/fa';

const RightSidebar = ({ blogs }) => {
  const displayedBlogs = blogs.slice(0, 8);

  return (
    <div className={styles.rightSidebar}>
      <div>
        <h3>Top Blogs</h3>
      </div>
      <ul>
        {displayedBlogs.length > 0 ? (
          displayedBlogs.map((blog) => {
            // Parse author information safely - similar to BlogCard implementation
            let parsedAuthor = { name: "Unknown", department: "N/A" };
            
            try {
              if (typeof blog.author === 'string') {
                if (blog.author.startsWith('{') && blog.author.endsWith('}')) {
                  try {
                    parsedAuthor = JSON.parse(blog.author);
                  } catch (err) {
                    console.error('Error parsing author JSON in sidebar:', err, blog.author);
                    if (!blog.author.includes('"name"') && !blog.author.includes(':')) {
                      parsedAuthor = { name: blog.author, department: "" };
                    }
                  }
                } else {
                  parsedAuthor = { name: blog.author, department: "" };
                }
              } else if (typeof blog.author === 'object' && blog.author !== null) {
                parsedAuthor = blog.author;
                
                if (!parsedAuthor.department && parsedAuthor.dept) {
                  parsedAuthor.department = parsedAuthor.dept;
                } else if (!parsedAuthor.department) {
                  parsedAuthor.department = "";
                }
              }
              
              // If there's no department info but we have additional blog data, try to find it
              if ((!parsedAuthor.department || parsedAuthor.department === "N/A") && blog.authorDepartment) {
                parsedAuthor.department = blog.authorDepartment;
              }
              
              // further attempt to extract department from various potential fields
              if ((!parsedAuthor.department || parsedAuthor.department === "N/A") && blog.authorDetails) {
                const authorDetails = typeof blog.authorDetails === 'string' 
                  ? JSON.parse(blog.authorDetails) 
                  : blog.authorDetails;
                  
                if (authorDetails && authorDetails.department) {
                  parsedAuthor.department = authorDetails.department;
                } else if (authorDetails && authorDetails.dept) {
                  parsedAuthor.department = authorDetails.dept;
                }
              }
            } catch (err) {
              console.error('Error handling author data in sidebar:', err);
            }
            
            return (
              <li key={blog.id || blog._id} className={styles.blogItem} 
                  onClick={() => {
                    const blogLink = blog.blogLink || blog.mediumLink || 'https://medium.com/@fedkiit';
                    window.open(blogLink, '_blank');
                  }} 
                  style={{ cursor: 'pointer' }}
              >
                {/* blog all things here */}
                <div className={styles.blogInfo}>
                  <h4 className={styles.blogHeading}>{blog.title || "Untitled Blog"} <FaExternalLinkAlt size={10} /></h4>
                  <p className={styles.blogAuthor}>
                    By {parsedAuthor.name || 'Unknown'}
                    {(parsedAuthor.department && parsedAuthor.department !== 'N/A') ? 
                      <span className={styles.authorDepartment}> ({parsedAuthor.department})</span> : 
                      (blog.authorDepartment ? <span className={styles.authorDepartment}> ({blog.authorDepartment})</span> : '')}
                  </p>
                </div>
              </li>
            );
          })
        ) : (
          <li>No blogs available</li>
        )}
      </ul>
    </div>
  );
};

export default RightSidebar;