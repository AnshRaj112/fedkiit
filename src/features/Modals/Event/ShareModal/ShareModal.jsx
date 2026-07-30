"use client";

import React from 'react';
// Was `react-share-social`, which is unmaintained and pulled in ~20 of this
// project's high-severity advisories through a bundled legacy jest toolchain.
// The local component takes the same props and renders the same panel.
import { ShareSocial } from "../../../../components/ShareSocial/ShareSocial";
import style from "./styles/ShareModal.module.scss";
import { X } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Share = (props) => {
  const{onClose,urlpath,teamData}=props;
  const sharestyle = {
    root: {
      background: 'rgba(42, 42, 42, 0.9)', 
      borderRadius: '10px',
      border: '2px solid #444',
      width: '22rem',
      height: '15rem', 
      boxShadow: '0 6px 10px 3px rgba(24, 15, .3)',
      color: '#f97507',
      padding: '1rem', 
      position: 'relative', 
      display: 'flex',
      flexDirection: 'column', 
      justifyContent: 'center', 
    },
    copyContainer: {
      border: '1px solid #f97507',
      background: 'rgba(0, 0, 0, 0.4)',
      borderRadius: '5px',
      padding: '0.5rem',
      margin: '0.5rem 0',
    },
    copyUrl: {
      overflowY: 'scroll',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none', 
    },
    title: {
      color: '#f97507',
      fontStyle: 'italic',
      marginBottom: '1rem',
    },
  };

  return (
    <div className={style.shareContainer}>
      <div className={style.overlay}></div>
      <div data-aos="zoom-in-up" data-aos-duration="500" className={style.maindiv}>
      {urlpath ?  <div style={{
          position:"relative"
        }}><div
          onClick={onClose}
          className={style.closebtn}
          style={{
            cursor: "pointer",
            position: "absolute",
            right: "1.5rem",
            top: "1.4rem",
            zIndex: "20",
            fontSize: "1.2rem",
          }}
        >
          <X />
        </div>
        <div style={{
          cursor: "pointer",
          position: "absolute",
          left: "1.5rem",
          top: "1.4rem",
          zIndex: "20",
          fontSize: "1.2rem",
          background: "var(--primary)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}>Share</div>
        <ShareSocial
          url={urlpath}
          style={sharestyle}
          socialTypes={['facebook', 'twitter', 'whatsapp', 'reddit', 'linkedin']}
          onSocialButtonClicked={data => console.log(data)}
        /></div>
        :
        <div style={{
          position:"relative"
        }}><div
          onClick={onClose}
          className={style.closebtn}
          style={{
            cursor: "pointer",
            position: "absolute",
            right: "1.5rem",
            top: "1.4rem",
            zIndex: "20",
            fontSize: "1.2rem",
          }}
        >
          <X />
        </div>
        <div style={{
          cursor: "pointer",
          position: "absolute",
          left: "1.5rem",
          top: "1.4rem",
          zIndex: "20",
          fontSize: "1.2rem",
          background: "var(--primary)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}>{teamData.teamName}</div>
        <ShareSocial
          url={teamData.teamCode}
          style={sharestyle}
          socialTypes={['facebook', 'twitter', 'whatsapp', 'reddit', 'linkedin']}
          onSocialButtonClicked={data => console.log(data)}
        /></div>
        }
        
      </div>
    </div>
  );
}

export default Share;
