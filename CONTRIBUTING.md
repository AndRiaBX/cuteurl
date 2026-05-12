# Contributing to CuteURL

Thank you for considering contributing to CuteURL! Here's everything you need to know.

## Table of Contents

- [Development Setup](#development-setup)
- [Running Tests](#running-tests)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

---

## Development Setup

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+

### Steps

```bash
# Fork the repository (click Fork button on GitHub)

# Clone your fork
git clone https://github.com/YOUR_USERNAME/cuteurl.git
cd cuteurl

# Add upstream remote
git remote add upstream https://github.com/AndRiaBX/cuteurl.git

# Install dependencies
npm install

# Verify setup by running tests
npm test
```

### Local development

```bash
# Start with hot-reload
npm run dev
```

The server will be available at `http://localhost:3000`.

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch
```

Tests use Node.js built-in `node:test` — no external test runner required.

### Writing tests

- Place test files in the `test/` directory
- Name them `test_*.js`
- Use `describe` and `it` blocks from `node:test`
- Use `node:assert/strict` for assertions
- Use `initTestDb()` from `db.js` for in-memory testing

---

## Code Style Guidelines

### General

- **Indentation:** 2 spaces (no tabs)
- **Semicolons:** Required
- **Quotes:** Single quotes for strings
- **Variables:** `const` by default, `let` only when reassignment is needed (never `var`)
- **Arrow functions:** Prefer over `function` keyword for callbacks

### Example

```js
// Good
const links = await getLinks();
return links.map(link => link.slug);

// Avoid
var links = getLinks();
return links.map(function(link) {
  return link.slug;
});
```

### Comments

- **WHAT** should be obvious from the code
- Use comments for **WHY** — explain rationale, trade-offs, edge cases

```js
// Good: explains why this unusual approach is needed
// Retry up to 10 times to avoid slug collisions at high throughput
for (let attempt = 0; attempt < 10; attempt++) {
  slug = nanoid(SLUG_LENGTH);
  ...
}
```

### Functions

- Keep functions small and focused (single responsibility)
- Use descriptive names
- Async/await preferred over raw promises or callbacks

### Error handling

- Handle errors explicitly with try/catch
- Return meaningful error messages to clients
- Log server-side errors with `console.error`

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): brief description

Optional body explaining the motivation.
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(api): add bulk URL shortening endpoint
fix(db): handle file write errors gracefully
docs(readme): add API reference and deployment guide
test: add edge case tests for URL validation
```

---

## Pull Request Process

1. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Add tests** for any new functionality

4. **Run the test suite** and ensure all tests pass:
   ```bash
   npm test
   ```

5. **Keep your branch up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

6. **Commit your changes** with a clear commit message:
   ```bash
   git commit -m "feat: add descriptive message"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request** on GitHub with:
   - A clear title describing the change
   - A description of what and why
   - Reference to any related issues (e.g., "Closes #42")

### PR Review Checklist

- [ ] Tests pass (`npm test`)
- [ ] New code has tests
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] No unnecessary files committed
- [ ] Commit messages follow conventions

---

## Reporting Issues

Use the [GitHub issue tracker](https://github.com/AndRiaBX/cuteurl/issues).

### Bug Reports

Include:
- A clear, descriptive title
- Steps to reproduce the problem
- Expected vs actual behavior
- Environment details (OS, Node.js version, browser if UI-related)
- Screenshots or logs if applicable

### Feature Requests

Include:
- A clear description of the feature
- The problem it solves
- How the feature should work (mockups, examples)
- Alternative approaches you've considered

---

## Code of Conduct

Be respectful and constructive. We're all here to build something useful.

---

## Getting Help

- Open an issue for questions
- PR comments for discussion on specific changes
- Check existing issues before asking

---

*Thank you for helping make CuteURL better!*
