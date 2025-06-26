# Academic Job Search Aggregator

A lightweight, **front-end-only** Vue 3 + Vite application that crawls a curated list of university and research-institute career pages in your browser, filters links by your keywords, and displays matching job postings—no backend required.

---

## 📖 Table of Contents

1. [Demo](#-demo)  
2. [Features](#-features)  
3. [Tech Stack](#-tech-stack)  
4. [Getting Started](#-getting-started)  
   - [Prerequisites](#prerequisites)  
   - [Install](#install)  
   - [Run Locally](#run-locally)  
5. [Project Structure](#-project-structure)  
6. [Usage](#-usage)  
7. [Deployment](#-deployment)  
   - [GitHub Pages (gh-pages)](#github-pages-gh-pages)  
   - [GitHub Pages (docs/ folder)](#github-pages-docs-folder)  
8. [Configuration](#-configuration)  
9. [CORS / Proxy](#-cors--proxy)  
10. [Contributing](#-contributing)  
11. [License](#-license)  
12. [Contact](#-contact)  

---

## 🚀 Demo

![Search UI screenshot](./screenshot.png)

Type keywords (e.g. `postdoc, blockchain`) and click **Search**. The app will:

1. Load each URL from `career_pages.json`  
2. Fetch & parse the HTML in-browser  
3. Extract all `<a>` links whose text contains any keyword  
4. Display title, link, and source page  

---

## ✨ Features

- **Keyword filtering**: comma-separated, case-insensitive  
- **Automated crawling**: iterates a JSON list of URLs  
- **Client-side parsing**: uses `fetch` + `DOMParser`—no server needed  
- **Progress indicator**: shows “Processing page X/Y”  
- **Zero-config**: clone → install → run  

---

## 🛠 Tech Stack

- **Vue 3** with Composition API  
- **TypeScript** for static typing  
- **Vite** for fast dev & builds  
- **Tailwind-style utility classes** for simple styling  

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v14+  
- npm (bundled with Node.js)

### Install

```bash
# Clone your fork / this repo
git clone git@github.com:<your-username>/academic-job-search.git
cd academic-job-search

# Install dependencies
npm install
