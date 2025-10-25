# Gemini Agent Engineering Guide

This document outlines the best practices and guidelines for developing the Tab Napper Chrome Extension with the assistance of a Gemini agent. Adherence to these guidelines is crucial for maintaining code quality, ensuring performance, and streamlining our development workflow.

## 1. Core Principles

*   **Chrome Extension Focus:** All development work targets the Google Chrome browser. Every code change, feature, and test must be considered within the context of a Chrome Extension's lifecycle, permissions, and APIs.
*   **Convention over Configuration:** We adhere to the established conventions in the project. Before making changes, analyze the existing code, file structure, and patterns.
*   **User-Centric Development:** The primary goal is to create a seamless and intuitive user experience. Performance and usability are paramount.

## 2. Code Quality & Style

*   **Style Guide:** We follow the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html).
*   **Linting:** All code must pass ESLint checks before being committed. Run `npm run lint` to check your code.
*   **Component Structure:** React components should be functional components using hooks. Keep components small and focused on a single responsibility.
*   **Comments:** Add comments to explain *why* a particular piece of code exists, especially for complex logic. Avoid commenting on *what* the code does, as this should be self-evident from clean code.

## 3. Performance Considerations

*   **Memory and CPU Usage:** Be mindful of the extension's resource consumption. Avoid memory leaks and unnecessary CPU cycles. Use Chrome's task manager to monitor the extension's performance.
*   **Background Script (`background.js`):** The background script should be as lightweight as possible. Offload heavy computations to content scripts or web workers where appropriate.
*   **Content Scripts:** Inject content scripts only when necessary. Be specific about the `matches` in the `manifest.json` to avoid injecting scripts into irrelevant pages.
*   **Storage:** Use `chrome.storage.local` for storing data. Be aware of the storage limitations and avoid storing large amounts of data. Use `chrome.storage.sync` only for user settings that need to be synced across devices.

## 4. Git Workflow: A Sane Git-Flow

We use a simplified Git flow inspired by GitHub Flow.

1.  **`main` branch is always deployable.** All code on `main` must be in a state that can be released to users.
2.  **Feature Development:**
    *   Create a new branch from `main` for each new feature or bug fix. Branch names should be descriptive (e.g., `feat/add-dark-mode`, `fix/login-bug`).
    *   Commit your changes to the feature branch. Write clear and concise commit messages.
    *   Open a Pull Request (PR) against `main` when the feature is complete and tested.
3.  **Code Review:**
    *   All PRs must be reviewed by at least one other engineer.
    *   The Gemini agent can be used to assist in code reviews, but a human review is mandatory.
4.  **Merging:**
    *   After a PR is approved and passes all checks, it can be merged into `main`.
    *   Use a squash merge to keep the `main` branch history clean.
5.  **Releases:**
    *   Releases are created from the `main` branch by tagging a specific commit with a version number (e.g., `v1.0.0`).

## 5. Chrome Extension Specifics

*   **`manifest.json`:** This is the heart of the extension. Understand the purpose of each field and be deliberate when making changes.
*   **Permissions:** Request only the permissions that are absolutely necessary for the extension to function. Be prepared to justify each permission in the Chrome Web Store review process.
*   **Security:** All code must be written with security in mind. Be aware of the potential for cross-site scripting (XSS) and other vulnerabilities. Sanitize all user input.
*   **Testing:**
    *   **Manual Testing:** Always allow me to manually run the tests before we approve and merge, you should add manual testing criteria as check marks in the branch push comments so a pull request is raised with a check list. Always run the build scripts before we start manual testing.

## 6. Senior Engineer Responsibilities

As a senior engineer on this project, you are expected to:

*   **Lead by example:** Write high-quality code and follow the guidelines in this document.
*   **Take ownership:** Be responsible for the features you build, from conception to deployment and maintenance.
*   **Think strategically:** Consider the long-term vision of the project and make decisions that will set us up for success.
*   **Continuously improve:** Stay up-to-date with the latest trends and technologies in Chrome extension development and web development in general.
