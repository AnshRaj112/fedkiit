"use client";

import React, { useEffect } from "react";
import { Hero, About, Sponser, Feedback, Contact } from "../../sections";
import { LiveEventPopup } from "../../features";

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <LiveEventPopup />
      <Hero />
      <About />
      <EventsSection />
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
