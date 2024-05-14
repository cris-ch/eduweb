"use strict";

/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
};

/**
 * navbar toggle
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
};

addEventOnElem(navTogglers, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  overlay.classList.remove("active");
};

addEventOnElem(navLinks, "click", closeNavbar);

/**
 * header active when scroll down to 100px
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const activeElem = function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
};

addEventOnElem(window, "scroll", activeElem);

// Search Functionality
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");
const mainContent = document.querySelector("main"); // Select the <main> element
const pageContent = mainContent.innerText; // Get the text content of the main content area

searchBtn.addEventListener("click", performSearch);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    performSearch();
  }
});

function performSearch() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  if (searchQuery) {
    removeHighlights(); // Remove previous highlights
    const matches = findMatches(searchQuery, pageContent);
    if (matches.length > 0) {
      const firstMatchElement = highlightMatches(matches, mainContent); // Pass the <main> element
      if (firstMatchElement) {
        firstMatchElement.scrollIntoView({ behavior: "smooth" });
        console.log(`Found ${matches.length} match(es) for "${searchQuery}"`);
      } else {
        console.log(`No matches found for "${searchQuery}"`);
      }
    } else {
      console.log(`No matches found for "${searchQuery}"`);
    }
  }
}

function findMatches(query, content) {
  const matches = [];
  const regex = new RegExp(query, "gi");
  const textNodes = document.createTreeWalker(
    mainContent,
    NodeFilter.SHOW_TEXT
  ); // Use the <main> element
  let currentNode;

  while ((currentNode = textNodes.nextNode())) {
    const match = currentNode.textContent.match(regex);
    if (match) {
      matches.push(...match);
    }
  }

  return matches;
}

function highlightMatches(matches, container) {
  const regex = new RegExp(`(${matches.join("|")})`, "gi");
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT); // Use the <main> element
  let currentNode;
  let firstMatchElement = null;

  while ((currentNode = walker.nextNode())) {
    const newNode = currentNode.textContent.replace(regex, (match) => {
      if (!firstMatchElement) {
        firstMatchElement = currentNode.parentNode;
      }
      return `<mark>${match}</mark>`;
    });
    if (newNode !== currentNode.textContent) {
      const newElement = document.createElement("span");
      newElement.innerHTML = newNode;
      const parentNode = currentNode.parentNode;
      parentNode.replaceChild(newElement, currentNode);
    }
  }

  return firstMatchElement;
}

function removeHighlights() {
  const marks = document.querySelectorAll("mark");
  marks.forEach((mark) => {
    const parentNode = mark.parentNode;
    const textNode = document.createTextNode(mark.textContent);
    parentNode.replaceChild(textNode, mark);
  });
}

// Scrolling bar

