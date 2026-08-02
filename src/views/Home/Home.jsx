"use client";

/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { Hero, About, Sponser, Feedback, Contact } from "../../sections";
import { LiveEventPopup } from "../../features";

const Home = () => {

  // Ran during render in the Vite app, which only ever executed in a browser.
  // Under Next.js this also runs on the server, where `window` is undefined.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <LiveEventPopup />
      <Hero />
      <About />
      <section id="Sponser">
        <Sponser />
      </section>
      <section id="Contact">
        <Contact />
      </section>
      <Feedback />
    </>
  );
};

export default Home;
