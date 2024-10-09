"use strict";

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded and parsed");

  // Navbar toggle
  const navbar = document.querySelector("[data-navbar]");
  const navTogglers = document.querySelectorAll("[data-nav-toggler]");
  const overlay = document.querySelector("[data-overlay]");

  console.log("Navbar:", navbar);
  console.log("Nav togglers:", navTogglers);
  console.log("Overlay:", overlay);

  function toggleNavbar() {
    console.log("Toggle navbar function called");
    
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("nav-active");

    console.log("Navbar classList:", navbar.classList);
    console.log("Overlay classList:", overlay.classList);
    console.log("Body classList:", document.body.classList);

    // Log computed styles
    const navbarStyles = window.getComputedStyle(navbar);
    console.log("Navbar computed styles:");
    console.log("- transform:", navbarStyles.transform);
    console.log("- left:", navbarStyles.left);
    console.log("- visibility:", navbarStyles.visibility);
    console.log("- z-index:", navbarStyles.zIndex);

    // Force a reflow to ensure the styles are applied immediately
    navbar.offsetHeight;

    // Remove this line:
    // alert("Navbar toggled. Check the console and inspect the page.");
  }

  navTogglers.forEach(toggler => {
    toggler.addEventListener("click", function(event) {
      console.log("Nav toggler clicked", event.target);
      toggleNavbar();
    });
  });

  // Close navbar when clicking on a nav link
  const navLinks = document.querySelectorAll("[data-nav-link]");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navbar.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("nav-active");
    });
  });

  // Header active when scroll down to 100px
  const header = document.querySelector("[data-header]");
  const backTopBtn = document.querySelector("[data-back-top-btn]");

  function activeElem() {
    if (window.scrollY > 100) {
      header.classList.add("active");
      backTopBtn.classList.add("active");
    } else {
      header.classList.remove("active");
      backTopBtn.classList.remove("active");
    }
  }

  window.addEventListener("scroll", activeElem);

  // ... (rest of your existing code)
});

