/**
 * @typedef Options
 * @property {string} options.directory Directory containing files to paginate
 * @property {number} options.perPage Number of files per page
 * @property {string} options.sortBy Property to sort by (e.g., 'date' or 'post.date')
 * @property {boolean} options.reverse Whether to reverse the sort order
 * @property {string} options.outputDir Directory pattern for output (e.g., 'blog/:num')
 * @property {string} options.indexLayout Layout to use for index pages
 * @property {string} options.firstIndexFile Name of first index file (e.g., 'blog.md')
 * @property {boolean} options.usePermalinks Whether to use permalinks-style URLs
 */

/** @type {Options} */
export const defaults = {
  directory: 'blog',
  perPage: 10,
  sortBy: 'date',
  reverse: true,
  outputDir: ':directory/:num',
  indexLayout: 'blog-index.njk',
  firstIndexFile: 'blog.md',
  usePermalinks: true
};

/**
 * Normalize plugin options
 * @param {Options} [options]
 * @returns {Object}
 */
export function normalizeOptions( options ) {
  return Object.assign( {}, defaults, options || {} );
}