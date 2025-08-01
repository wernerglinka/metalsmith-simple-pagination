import { moveFile } from './fileProcessing.js';
import {
  findMostRecentDate,
  generatePaginationUrls,
  createPaginationMetadata,
  createFileDetails,
} from './helpers.js';

/**
 * Helper function to process files for a page
 * @param {Object} files - The Metalsmith files object
 * @param {Array} pageFiles - The files for this page
 * @param {string} directory - The directory containing files
 * @param {number} pageNum - The page number
 * @param {number} totalPages - The total number of pages
 * @param {Object} options - The plugin options
 * @param {function} debug - The debug function
 * @returns {Array} Array of file details
 */
export const processPageFiles = (
  files,
  pageFiles,
  directory,
  pageNum,
  totalPages,
  options,
  debug
) => {
  const fileDetails = [];

  // Process each file in the page
  pageFiles.forEach((pageFile) => {
    const oldPath = pageFile.path;
    const fileName = oldPath.split('/').pop();
    // Get the basename without extension
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    // Get the original extension
    const extension = fileName.match(/\.[^/.]+$/) ? fileName.match(/\.[^/.]+$/)[0] : '.html';

    let newPath;
    if (options.usePermalinks) {
      // Create a directory for each blog post (permalink style)
      newPath = `${directory}/${baseName}/index${extension}`;
    } else {
      // Keep the original path (non-permalink style)
      newPath = oldPath;
    }

    // Create a new file entry with the updated path
    if (newPath !== oldPath) {
      moveFile(files, pageFile, oldPath, newPath, pageNum, totalPages, debug);
    } else {
      // Just add pagination metadata without moving the file
      files[oldPath].pageNumber = pageNum;
      files[oldPath].totalPages = totalPages;
    }

    // Create detailed file data (excluding contents)
    fileDetails.push(createFileDetails(pageFile, newPath, options.usePermalinks));
  });

  return fileDetails;
};

/**
 * Process a non-first index page
 * @param {Object} files - The Metalsmith files object
 * @param {Array} pageFiles - The files for this page
 * @param {number} pageNum - The page number
 * @param {number} totalPages - The total number of pages
 * @param {Object} options - The plugin options
 * @param {Object} metadata - The global metadata
 * @param {function} debug - The debug function
 */
export const processIndexPage = (
  files,
  pageFiles,
  pageNum,
  totalPages,
  options,
  metadata,
  debug
) => {
  // Determine page path
  const pagePath = options.outputDir
    .replace(':directory', options.directory)
    .replace(':num', pageNum);
  let indexFile;
  if (options.usePermalinks) {
    // Permalink style: /blog/2/index.html
    indexFile = `${pagePath}/index.html`;
  } else {
    // Non-permalink style: /blog/2.html
    indexFile = `${pagePath}.html`;
  }
  debug('Processing page %d with path: %s', pageNum, indexFile);

  // Process files and get file details
  const fileDetails = processPageFiles(
    files,
    pageFiles,
    options.directory,
    pageNum,
    totalPages,
    options,
    debug
  );

  // Get the most recent date from the files on this page
  const mostRecentDate = findMostRecentDate(pageFiles, options.sortBy);

  // Create file stats similar to what Metalsmith would provide
  const now = new Date();
  const fileStats = {
    atime: now,
    mtime: now,
    ctime: now,
    birthtime: now,
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
    lastUrl,
    options.usePermalinks
  );

  // Create index file for this page with pagination metadata compatible with metalsmith-pagination
  files[indexFile] = {
    pagination: paginationMetadata,
    // Add for backward compatibility with our plugin
    pageFiles: fileDetails,
    // Add date information
    date: mostRecentDate,
    // Add file stats
    stats: fileStats,
    // Include global metadata if available
    ...(metadata || {}),
    layout: options.indexLayout,
    contents: Buffer.from(''),
  };
  debug('Created index file: %s', indexFile);
};

/**
 * Process the first index page
 * @param {Object} files - The Metalsmith files object
 * @param {Array} firstIndexFiles - The files for the first page
 * @param {number} totalPages - The total number of pages
 * @param {Object} options - The plugin options
 * @param {function} debug - The debug function
 */
export const processFirstIndexPage = (files, firstIndexFiles, totalPages, options, debug) => {
  debug('Processing first page with %d files', firstIndexFiles.length);

  // Process files and get file details
  const fileDetails = processPageFiles(
    files,
    firstIndexFiles,
    options.directory,
    1,
    totalPages,
    options,
    debug
  );

  // Generate clean URLs for first page pagination (no previous URL needed)
  const { firstUrl, lastUrl, nextUrl } = generatePaginationUrls(
    options.directory,
    options.outputDir,
    1,
    totalPages,
    options.usePermalinks
  );
  debug('Pagination URLs for first page: first=%s, next=%s, last=%s', firstUrl, nextUrl, lastUrl);

  // Update the metadata for the first page file if it exists
  if (files[options.firstIndexFile]) {
    debug('Adding pagination metadata to first page file: %s', options.firstIndexFile);

    // Create pagination metadata
    const paginationMetadata = createPaginationMetadata(
      options.directory,
      1, // First page
      totalPages,
      fileDetails,
      nextUrl,
      null, // No previous URL for first page
      firstUrl,
      lastUrl,
      options.usePermalinks
    );

    // Add pagination metadata to the first page file
    files[options.firstIndexFile].pagination = paginationMetadata;
    files[options.firstIndexFile].pageFiles = fileDetails;
  } else {
    debug('First page file %s not found, skipping metadata update', options.firstIndexFile);
  }
};
