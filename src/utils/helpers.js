/**
 * Create pagination metadata in a format compatible with metalsmith-pagination
 * @param {string} directory - The directory containing files
 * @param {number} pageNum - The current page number
 * @param {number} totalPages - The total number of pages
 * @param {Array} files - The files for this page
 * @param {string} nextUrl - URL to the next page
 * @param {string} prevUrl - URL to the previous page
 * @param {string} firstUrl - URL to the first page
 * @param {string} lastUrl - URL to the last page
 * @returns {Object} Pagination metadata
 */
export const createPaginationMetadata = ( directory, pageNum, totalPages, files, nextUrl, prevUrl, firstUrl, lastUrl ) => {
  return {
    name: directory,
    num: pageNum,
    total: totalPages,
    files: files,
    next: nextUrl || null,
    previous: prevUrl || null,
    first: firstUrl,
    last: lastUrl
  };
};

/**
 * Find the most recent date from a collection of files
 * @param {Array} files - Array of file objects
 * @param {string} sortBy - Property to check for date
 * @returns {Date|null} The most recent date or null if no dates found
 */
export const findMostRecentDate = ( files, sortBy ) => {
  let mostRecent = null;

  files.forEach( file => {
    const fileDate = getNestedProperty( file, sortBy );
    if ( fileDate instanceof Date ) {
      if ( !mostRecent || fileDate > mostRecent ) {
        mostRecent = fileDate;
      }
    }
  } );

  return mostRecent;
};

/**
 * Helper function to get a nested property from an object
 * @param {Object} obj - The object to get the property from
 * @param {string} path - The path to the property (e.g., 'post.date')
 * @returns {*} The value of the property or undefined if not found
 */
export const getNestedProperty = ( obj, path ) => {
  if ( !path ) return undefined;
  const parts = path.split( '.' );
  let current = obj;

  for ( const part of parts ) {
    if ( current === undefined || current === null ) {
      return undefined;
    }
    current = current[ part ];
  }

  return current;
};

/**
 * Create a clean URL from a file path
 * @param {string} path - The file path
 * @returns {string} The clean URL
 */
export const createCleanUrl = ( path ) => {
  // Remove index.html from the end of the path
  let cleanPath = path.replace( /\/index\.html$/, '/' );
  // Remove .html from the end of the path
  cleanPath = cleanPath.replace( /\.html$/, '' );
  // Ensure the path starts with a slash
  if ( !cleanPath.startsWith( '/' ) ) {
    cleanPath = '/' + cleanPath;
  }
  return cleanPath;
};

/**
 * Generate pagination URLs for a page
 * @param {string} directory - The directory containing files
 * @param {string} outputDir - The output directory pattern
 * @param {number} pageNum - The current page number
 * @param {number} totalPages - The total number of pages
 * @param {boolean} usePermalinks - Whether to use permalinks-style URLs
 * @returns {Object} Object with firstUrl, lastUrl, nextUrl, prevUrl
 */
export const generatePaginationUrls = ( directory, outputDir, pageNum, totalPages, usePermalinks ) => {
  // Format URLs based on permalink style
  let firstUrl, lastUrl, nextUrl, prevUrl;

  if ( usePermalinks ) {
    // Permalink style: /blog/, /blog/2/
    firstUrl = `/${ directory }/`;
    lastUrl = `/${ directory }/${ totalPages }/`;
    nextUrl = pageNum < totalPages ? `/${ directory }/${ pageNum + 1 }/` : null;
    prevUrl = pageNum > 1 ? ( pageNum === 2 ? `/${ directory }/` : `/${ directory }/${ pageNum - 1 }/` ) : null;
  } else {
    // Non-permalink style: /blog.html, /blog/2.html
    firstUrl = `/${ directory }.html`;
    lastUrl = pageNum === totalPages ? `/${ directory }/${ totalPages }.html` : `/${ directory }/${ totalPages }.html`;
    nextUrl = pageNum < totalPages ? `/${ directory }/${ pageNum + 1 }.html` : null;
    prevUrl = pageNum > 1 ? ( pageNum === 2 ? `/${ directory }.html` : `/${ directory }/${ pageNum - 1 }.html` ) : null;
  }

  return { firstUrl, lastUrl, nextUrl, prevUrl };
};

/**
 * Helper function to create file details for pagination metadata
 * @param {Object} fileData - The file data
 * @param {string} newPath - The new path for the file
 * @returns {Object} File details without contents and with clean URL path
 */
export const createFileDetails = ( fileData, newPath ) => {
  const fileDetail = {
    ...fileData
  };
  delete fileDetail.contents; // Contents not needed in the metadata

  // Fix the path to ensure it doesn't end with just 'index'
  let cleanPath = createCleanUrl( newPath );
  if ( cleanPath.endsWith( '/index' ) ) {
    cleanPath = cleanPath.replace( /\/index$/, '/' );
  }
  fileDetail.path = cleanPath;

  return fileDetail;
};
