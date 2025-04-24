// File: src/index.js
import { normalizeOptions } from './utils/options.js';
import { filterAndSortFiles } from './utils/fileProcessing.js';
import { processPage, processFirstPage } from './utils/pageProcessing.js';

/**
 * Simple pagination plugin for Metalsmith
 * Creates paginated directories from a source directory of similar files,
 * with pagination metadata compatible with metalsmith-pagination
 *
 * @param {Object} options Configuration options
 * @return {Function} Metalsmith plugin function
 */
export default function simplePagination( options = {} ) {
  options = normalizeOptions( options );

  // The main plugin function
  return function( files, metalsmith, done ) {
    try {
      const debug = metalsmith.debug( 'metalsmith-simple-pagination' );
      debug( 'Starting pagination process with options: %o', options );

      // Get metadata from metalsmith
      const metadata = metalsmith.metadata();

      // Filter and sort the files
      const targetFiles = filterAndSortFiles( files, options, debug );

      // If no files found, skip pagination
      if ( targetFiles.length === 0 ) {
        debug( 'No files found in directory %s, skipping pagination', options.directory );
        return done();
      }

      // Group files into chunks for pages
      const pages = [];
      for ( let i = 0; i < targetFiles.length; i += options.perPage ) {
        pages.push( targetFiles.slice( i, i + options.perPage ) );
      }
      debug( 'Created %d pages with %d items per page', pages.length, options.perPage );

      // Create paginated directories and add pagination metadata for pages after the first
      for ( let index = 1; index < pages.length; index++ ) {
        const pageFiles = pages[ index ];
        const pageNum = index + 1; // Start at 2
        processPage( files, pageFiles, pageNum, pages.length, options, metadata, debug );
      }

      // Handle the first page
      if ( pages.length > 0 ) {
        const firstIndexFiles = pages[ 0 ];
        processFirstPage( files, firstIndexFiles, pages.length, options, debug );
      }
      debug( 'Pagination process completed' );
      done();
    } catch ( error ) {
      // Handle unexpected errors
      console.error( 'Error in metalsmith-simple-pagination plugin:', error );
      done( error );
    }
  };
}
