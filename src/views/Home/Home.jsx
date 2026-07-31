"use client";

/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
// Imported from sections/Home, not the sections barrel. That barrel also
// re-exports sections/Profile — the whole admin panel — and because every one
// of them is a client component the bundler pulled the entire graph into the
// landing page: certificate tooling, admin tables, the lot.
import { Hero, About, Sponser, Feedback, Contact } from "../../sections/Home";
// Direct, for the same reason: the features barrel also exports EventStats,
// the avatar editor and the admin form modals.
import LiveEventPopup from "../../features/Modals/Event/LiveEventPopup/LiveEventPopup";

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
