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
 * @param {boolean} usePermalinks - Whether to use permalinks-style URLs
 * @returns {Object} Pagination metadata
 */
export const createPaginationMetadata = (
  directory,
  pageNum,
  totalPages,
  files,
  nextUrl,
  prevUrl,
  firstUrl,
  lastUrl,
  usePermalinks = true
) => {
  return {
    name: directory,
    num: pageNum,
    total: totalPages,
    pages: totalPages, // Add pages property for compatibility with metalsmith-pagination
    files: files,
    next: nextUrl || null,
    previous: prevUrl || null,
    first: firstUrl,
    last: lastUrl,
    usePermalinks: usePermalinks // Add flag to indicate URL style for templates
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

  files.forEach( ( file ) => {
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
 * @param {string} propertyPath - The path to the property (e.g., 'post.date')
 * @returns {*} The value of the property or undefined if not found
 */
export const getNestedProperty = ( obj, propertyPath ) => {
  if ( !propertyPath ) {
    return undefined;
  }
  const parts = propertyPath.split( '.' );
  let current = obj;

  for ( const part of parts ) {
    if ( current === undefined || current === null ) {
      return undefined;
    }
    current = current[part];
  }

  return current;
};

/**
 * Create a clean URL from a file path
 * @param {string} path - The file path
 * @param {boolean} usePermalinks - Whether to use permalinks-style URLs
 * @returns {string} The normalized and clean URL
 */
export const createCleanUrl = ( path, usePermalinks = true ) => {
  // Remove index.html from the end of the path
  let normalizedPath = path.replace( /\/index\.html$/, '/' );

  if ( usePermalinks ) {
    // Remove .html from the end of the path for permalink style
    normalizedPath = normalizedPath.replace( /\.html$/, '' );
  }

  // Ensure the path starts with a slash
  if ( !normalizedPath.startsWith( '/' ) ) {
    normalizedPath = `/${normalizedPath}`;
  }
  return normalizedPath;
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

  // Replace tokens in outputDir pattern
  const getPagePath = ( num ) => {
    if ( num === 1 ) {
      return directory;
    }
    return outputDir.replace( ':directory', directory ).replace( ':num', num );
  };

  if ( usePermalinks ) {
    // Permalink style: /blog/, /blog/2/
    firstUrl = `/${getPagePath( 1 )}/`;
    lastUrl = `/${getPagePath( totalPages )}/`;
    nextUrl = pageNum < totalPages ? `/${getPagePath( pageNum + 1 )}/` : null;
    prevUrl = pageNum > 1 ? `/${getPagePath( pageNum - 1 )}/` : null;
  } else {
    // Non-permalink style: /blog.html, /blog/2.html
    firstUrl = `/${getPagePath( 1 )}.html`;
    lastUrl = `/${getPagePath( totalPages )}.html`;
    nextUrl = pageNum < totalPages ? `/${getPagePath( pageNum + 1 )}.html` : null;
    prevUrl = pageNum > 1 ? `/${getPagePath( pageNum - 1 )}.html` : null;
  }

  return { firstUrl, lastUrl, nextUrl, prevUrl };
};

/**
 * Helper function to create file details for pagination metadata
 * @param {Object} pageFile - The file data
 * @param {string} newPath - The new path for the file
 * @param {boolean} usePermalinks - Whether to use permalinks-style URLs
 * @returns {Object} File details without contents and with clean URL path
 */
export const createFileDetails = ( pageFile, newPath, usePermalinks = true ) => {
  const fileDetail = {
    ...pageFile
  };
  delete fileDetail.contents; // Contents not needed in the metadata

  // Convert markdown paths to html paths and format according to usePermalinks
  // First, replace any .md extension with .html
  let normalizedPath = newPath.replace( /\.md$/, '.html' );

  // Then apply clean URL formatting based on usePermalinks
  normalizedPath = createCleanUrl( normalizedPath, usePermalinks );

  // Fix paths that end with /index
  if ( normalizedPath.endsWith( '/index' ) ) {
    normalizedPath = normalizedPath.replace( /\/index$/, '/' );
  }

  // For non-permalink style, ensure .html extension is present
  if ( !usePermalinks && !normalizedPath.endsWith( '.html' ) ) {
    normalizedPath = `${normalizedPath}.html`;
  }

  fileDetail.path = normalizedPath;

  return fileDetail;
};
