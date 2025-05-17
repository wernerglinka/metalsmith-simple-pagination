# metalsmith-simple-pagination

A simple pagination plugin for Metalsmith that creates paginated directories from a source directory of similar files, with pagination metadata compatible with metalsmith-pagination.

[![metalsmith:plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]
[![Known Vulnerabilities](https://snyk.io/test/github/wernerglinka/metalsmith-simple-pagination/badge.svg)](https://snyk.io/test/github/wernerglinka/metalsmith-simple-pagination/badge)

## Features

- Creates paginated directories from a source directory with a configurable number of files per page
- Generates clean pagination URLs for both permalink and non-permalink styles
- Provides pagination metadata compatible with metalsmith-pagination
- Customizable sorting by any metadata property, including nested properties
- Preserves all file metadata while adding pagination references
- Works seamlessly with blog posts and similar collections of files
- Supports both ESM and CommonJS module formats

## Installation

```bash
npm install metalsmith-simple-pagination
```

## Usage

This plugin follows the standard Metalsmith plugin pattern and can be used both with ESM and CommonJS.

### ESM (preferred)

```javascript
import metalsmith from 'metalsmith';
import simplePagination from 'metalsmith-simple-pagination';

metalsmith(__dirname)
  .use(
    simplePagination({
      directory: 'blog', // Directory containing files to paginate
      perPage: 10, // Number of posts per page
      sortBy: 'date', // Sort posts by this property (e.g., date or post.date)
      reverse: true, // Sort in descending order (newest first)
      firstIndexFile: 'blog.md' // First page will update metadata of this file
    })
  )
  .build((err) => {
    if (err) throw err;
    console.log('Build complete!');
  });
```

### CommonJS

```javascript
const metalsmith = require('metalsmith');
const simplePagination = require('metalsmith-simple-pagination');

metalsmith(__dirname)
  .use(
    simplePagination({
      directory: 'blog', // Directory containing files to paginate
      perPage: 10, // Number of posts per page
      sortBy: 'date', // Sort posts by this property (e.g., date or post.date)
      reverse: true, // Sort in descending order (newest first)
      firstIndexFile: 'blog.md' // First page will update metadata of this file
    })
  )
  .build((err) => {
    if (err) throw err;
    console.log('Build complete!');
  });
```

## Options

| Option         | Type    | Default           | Description                                                 |
| -------------- | ------- | ----------------- | ----------------------------------------------------------- |
| directory      | String  | 'blog'            | Directory containing files to paginate                      |
| perPage        | Number  | 10                | Number of files per page                                    |
| sortBy         | String  | 'date'            | Property to sort by (e.g., 'date' or 'post.date')           |
| reverse        | Boolean | true              | Whether to reverse the sort order (true = newest first)     |
| outputDir      | String  | ':directory/:num' | Directory pattern for output (supports :directory and :num) |
| indexLayout    | String  | 'blog-index.njk'  | Layout to use for index pages                               |
| firstIndexFile | String  | 'blog.md'         | Name of first page file (e.g., 'blog.md')                   |
| usePermalinks  | Boolean | true              | Whether to use permalinks-style URLs (/blog/ vs /blog.html) |

## How It Works

This plugin provides a simple way to paginate a collection of files (like blog posts) into separate pages. Here's what it does:

1. **Sources files**: Finds all files in the specified directory
2. **Sorts files**: Sorts them by the specified property (e.g., date)
3. **Groups files**: Creates groups based on the perPage setting
4. **Creates pages**: For each group:
   - Creates a new directory following the outputDir pattern
   - Moves the files to this directory
   - Adds pagination metadata
   - Creates an index.html file with the pagination information

### First Page Handling

For the first page, the plugin:

1. Moves the first perPage files to the root of your directory (e.g., /blog/)
2. Updates the specified firstIndexFile (e.g., blog.md) with pagination metadata

### Generated Metadata

Each paginated file will have these additional properties:

- `originalPath`: The original file path before pagination
- `pageNumber`: The page number this file appears on
- `totalPages`: Total number of pages in the pagination

Each page's index file will have this pagination metadata:

```javascript
{
  pagination: {
    name: 'blog',           // The directory name
    num: 2,                 // Current page number
    pages: 5,               // Total number of pages
    files: [...],           // Array of file metadata for this page
    next: '/blog/3',        // URL to next page (null if last page)
    previous: '/blog',      // URL to previous page (null if first page)
    first: '/blog',         // URL to first page
    last: '/blog/5'         // URL to last page
  },
  pageFiles: [...],         // Same as pagination.files (for backward compatibility)
  date: [Date object],      // Most recent date from files on this page
  layout: 'blog-index.njk', // Layout template for the index page
}
```

## Example Project Structure

Before pagination:

```
src/
├── blog/
│   ├── etiam-porta-sem-malesuada-magna-mollis-euismod.md
│   ├── curabitur-blandit-empus-porttitor.md
│   ├── cras-mattis-consectetur-purus.md
│   ├── ipsum-cras-ullamcorper-fringilla.md
│   └── duis-mollis-est-non-commodo-uctus.md
└── blog.md  // Index page for the blog
```

After pagination (with perPage = 2):

```
build/
├── blog/
│   ├── index.md        // First page with pagination metadata
│   ├── 2/
│   │   └── index.html  // Pagination metadata for page 2
│   ├── 3/
│   │   └── index.html  // Pagination metadata for page 3
│   ├── etiam-porta-sem-malesuada-magna-mollis-euismod/
│   │   └── index.md    // Individual post
│   ├── curabitur-blandit-empus-porttitor/
│   │   └── index.md    // Individual post
│   ├── cras-mattis-consectetur-purus/
│   │   └── index.md    // Individual post
│   ├── ipsum-cras-ullamcorper-fringilla/
│   │   └── index.md    // Individual post
│   └── duis-mollis-est-non-commodo-uctus/
│       └── index.md    // Individual post
```

At this point the generated index files (`2/index.html` and `3/index.html`)will be empty but their metadata will be populated.

## Test Coverage

This plugin maintains high test coverage to ensure reliability. Current test coverage is displayed in the badge at the top of this README.

To run tests locally:

```bash
npm test
```

To view coverage details:

```bash
npm run coverage
```

## Debug

This plugin uses Metalsmith's debug functionality. To enable debug logs, set the `DEBUG` environment variable:

```bash
metalsmith.env('DEBUG', 'metalsmith-simple-pagination')
```

## CLI Usage

To use this plugin with the Metalsmith CLI, add it to your `metalsmith.json` file:

```json
{
  "plugins": {
    "metalsmith-simple-pagination": {
      "directory": "blog",
      "perPage": 10,
      "sortBy": "date",
      "reverse": true,
      "firstIndexFile": "blog.md"
    }
  }
}
```

## License

MIT

[npm-badge]: https://img.shields.io/npm/v/metalsmith-simple-pagination.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-simple-pagination
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-simple-pagination
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-96%25-brightgreen
[coverage-url]: https://github.com/wernerglinka/metalsmith-simple-pagination/actions/workflows/test.yml
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue
