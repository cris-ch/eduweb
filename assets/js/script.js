"use strict";

document.addEventListener('DOMContentLoaded', function() {


  // Navbar toggle
  const navbar = document.querySelector("[data-navbar]");
  const navTogglers = document.querySelectorAll("[data-nav-toggler]");
  const overlay = document.querySelector("[data-overlay]");

  function toggleNavbar() {
    
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("nav-active");;

    // Force a reflow to ensure the styles are applied immediately
    navbar.offsetHeight;

  }

  navTogglers.forEach(toggler => {
    toggler.addEventListener("click", function(event) {
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

});

