import React from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Footer from "./components/Footer";
import Schedule from "./components/Schedule";
import "./index.css";

export default function App() {
  return (
    <>
      <main>
        <Hero />
        <About />
        <Schedule />
      </main>
    </>
  );
}