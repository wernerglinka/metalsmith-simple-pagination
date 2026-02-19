// File: src/index.js
import { normalizeOptions } from './utils/options.js';
import { filterAndSortFiles } from './utils/fileProcessing.js';
import { processIndexPage, processFirstIndexPage } from './utils/pageProcessing.js';

/**
 * Simple pagination plugin for Metalsmith
 * Generates page index files for paginated content with pagination metadata
 * compatible with metalsmith-pagination. It does not move content files to
 * paginated directories, but instead creates index files with pagination metadata.
 *
 * @param {Object} options Configuration options
 * @return {Function} Metalsmith plugin function
 */
export default function simplePagination(options = {}) {
  options = normalizeOptions(options);

  // The main plugin function (two-phase pattern)
  // Phase 1: Configuration processing happens above
  // Phase 2: File processing happens in this returned function
  const plugin = function (files, metalsmith, done) {
    try {
      const debug = metalsmith.debug('metalsmith-simple-pagination');
      debug('Starting pagination process with options: %o', options);

      // Get metadata from metalsmith
      const metadata = metalsmith.metadata();

      // Filter and sort the files
      const targetFiles = filterAndSortFiles(files, options, debug);

      // If no files found, skip pagination
      if (targetFiles.length === 0) {
        debug('No files found in directory %s, skipping pagination', options.directory);
        return done();
      }

      // Group files into chunks for pages
      const pages = [];
      for (let i = 0; i < targetFiles.length; i += options.perPage) {
        pages.push(targetFiles.slice(i, i + options.perPage));
      }
      debug('Created %d pages with %d items per page', pages.length, options.perPage);

      // Create pagination index files and add pagination metadata for pages after the first
      for (let index = 1; index < pages.length; index++) {
        const pageFiles = pages[index];
        const pageNum = index + 1; // Start at 2
        processIndexPage(files, pageFiles, pageNum, pages.length, options, metadata, debug);
      }

      // Handle the first page
      if (pages.length > 0) {
        const firstIndexFiles = pages[0];
        processFirstIndexPage(files, firstIndexFiles, pages.length, options, debug);
      }
      debug('Pagination process completed');
      done();
    } catch (error) {
      // Handle unexpected errors
      console.error('Error in metalsmith-simple-pagination plugin:', error);
      done(error);
    }
  };

  // Set function name for debugging
  Object.defineProperty(plugin, 'name', {
    value: 'metalsmith-simple-pagination',
    configurable: true
  });

  return plugin;
}
