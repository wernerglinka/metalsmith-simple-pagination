import { moveFile } from './fileProcessing.js';
import { findMostRecentDate, generatePaginationUrls, createPaginationMetadata, createFileDetails } from './helpers.js';

/**
 * Helper function to process files for a page
 * @param {Object} files - The Metalsmith files object
 * @param {Array} pageFiles - The files for this page
 * @param {string} directory - The directory containing files
 * @param {number} pageNum - The page number
 * @param {number} totalPages - The total number of pages
 * @param {function} debug - The debug function
 * @returns {Array} Array of file details
 */
export const processPageFiles = ( files, pageFiles, directory, pageNum, totalPages, debug ) => {
  const fileDetails = [];

  // Process each file in the page
  pageFiles.forEach( ( fileData ) => {
    const oldPath = fileData.path;
    const fileName = oldPath.split( '/' ).pop();
    // Get the basename without extension
    const baseName = fileName.replace( /\.[^/.]+$/, '' );
    // Get the original extension
    const extension = fileName.match( /\.[^/.]+$/ ) ? fileName.match( /\.[^/.]+$/ )[ 0 ] : '.html';
    // Create a directory for each blog post
    const newPath = `${ directory }/${ baseName }/index${ extension }`;

    // Create a new file entry with the updated path
    moveFile( files, fileData, oldPath, newPath, pageNum, totalPages, debug );

    // Create detailed file data (excluding contents)
    fileDetails.push( createFileDetails( fileData, newPath ) );
  } );

  return fileDetails;
};

/**
 * Process a non-first page
 * @param {Object} files - The Metalsmith files object
 * @param {Array} pageFiles - The files for this page
 * @param {number} pageNum - The page number
 * @param {number} totalPages - The total number of pages
 * @param {Object} options - The plugin options
 * @param {Object} metadata - The global metadata
 * @param {function} debug - The debug function
 */
export const processPage = ( files, pageFiles, pageNum, totalPages, options, metadata, debug ) => {
  // Determine page path
  const pagePath = options.outputDir.replace( ':directory', options.directory ).replace( ':num', pageNum );
  const indexFile = `${ pagePath }/index.html`;
  debug( 'Processing page %d with path: %s', pageNum, pagePath );

  // Process files and get file details
  const fileDetails = processPageFiles( files, pageFiles, options.directory, pageNum, totalPages, debug );

  // Get the most recent date from the files on this page
  const mostRecentDate = findMostRecentDate( pageFiles, options.sortBy );

  // Create file stats similar to what Metalsmith would provide
  const now = new Date();
  const fileStats = {
    atime: now,
    mtime: now,
    ctime: now,
    birthtime: now
  };

  // Generate clean URLs for pagination
  const { firstUrl, lastUrl, nextUrl, prevUrl } = generatePaginationUrls(
    options.directory,
    options.outputDir,
    pageNum,
    totalPages,
    options.usePermalinks
  );
  debug(
    'Pagination URLs for page %d: first=%s, prev=%s, next=%s, last=%s',
    pageNum,
    firstUrl,
    prevUrl,
    nextUrl,
    lastUrl
  );

  // Create pagination metadata
  const paginationMetadata = createPaginationMetadata(
    options.directory,
    pageNum,
    totalPages,
    fileDetails,
    nextUrl,
    prevUrl,
    firstUrl,
    lastUrl
  );

  // Create index file for this page with pagination metadata compatible with metalsmith-pagination
  files[ indexFile ] = {
    pagination: paginationMetadata,
    // Add for backward compatibility with our plugin
    pageFiles: fileDetails,
    // Add date information
    date: mostRecentDate,
    // Add file stats
    stats: fileStats,
    // Include global metadata if available
    ...( metadata || {} ),
    layout: options.indexLayout,
    contents: Buffer.from( '' )
  };
  debug( 'Created index file: %s', indexFile );
};

/**
 * Process the first page
 * @param {Object} files - The Metalsmith files object
 * @param {Array} firstIndexFiles - The files for the first page
 * @param {number} totalPages - The total number of pages
 * @param {Object} options - The plugin options
 * @param {function} debug - The debug function
 */
export const processFirstPage = ( files, firstIndexFiles, totalPages, options, debug ) => {
  debug( 'Processing first page with %d files', firstIndexFiles.length );

  // Process files and get file details
  const fileDetails = processPageFiles( files, firstIndexFiles, options.directory, 1, totalPages, debug );

  // Generate clean URLs for first page pagination (no previous URL needed)
  const { firstUrl, lastUrl, nextUrl } = generatePaginationUrls(
    options.directory,
    options.outputDir,
    1,
    totalPages,
    options.usePermalinks
  );
  debug( 'Pagination URLs for first page: first=%s, next=%s, last=%s', firstUrl, nextUrl, lastUrl );

  // Update the metadata for the first page file if it exists
  if ( files[ options.firstIndexFile ] ) {
    debug( 'Adding pagination metadata to first page file: %s', options.firstIndexFile );

    // Create pagination metadata
    const paginationMetadata = createPaginationMetadata(
      options.directory,
      1, // First page
      totalPages,
      fileDetails,
      nextUrl,
      null, // No previous URL for first page
      firstUrl,
      lastUrl
    );

    // Add pagination metadata to the first page file
    files[ options.firstIndexFile ].pagination = paginationMetadata;
    files[ options.firstIndexFile ].pageFiles = fileDetails;
  } else {
    debug( 'First page file %s not found, skipping metadata update', options.firstIndexFile );
  }
};
