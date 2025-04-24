/**
 * Helper function to get nested properties from an object
 * @param {Object} obj - The object to get a property from
 * @param {string} path - The property path (e.g., 'meta.date')
 * @returns {*} The property value or undefined if not found
 */
const getNestedProperty = ( obj, path ) => {
  const parts = path.split( '.' );
  return parts.reduce( ( acc, part ) => ( acc && acc[ part ] !== undefined ? acc[ part ] : undefined ), obj );
};

/**
 * Helper function to create a clean URL (remove file extensions)
 * @param {string} path - The path to clean
 * @returns {string} The cleaned URL
 */
const createCleanUrl = ( path ) => {
  // Special handling for index.html files
  if ( path.endsWith( '/index.html' ) ) {
    // For index.html files, return the directory path with trailing slash
    return `/${ path.replace( /\/index\.html$/, '/' ) }`;
  }

  // Remove file extensions (.md, .html, etc.)
  path = path.replace( /\.(md|html)$/, '' );

  // Add leading slash if not present
  if ( !path.startsWith( '/' ) ) {
    path = `/${ path }`;
  }

  // Ensure path doesn't end with trailing slash unless it's just "/"
  if ( path.length > 1 && path.endsWith( '/' ) ) {
    path = path.slice( 0, -1 );
  }
  return path;
};

/**
 * Helper function to generate pagination URLs
 * @param {string} directory - The directory name
 * @param {string} outputPattern - The output directory pattern
 * @param {number} pageNum - The current page number
 * @param {number} totalPages - The total number of pages
 * @param {boolean} usePermalinks - Whether to use permalinks style URLs
 * @returns {Object} Object containing first, last, next, and previous URLs
 */
const generatePaginationUrls = ( directory, outputPattern, pageNum, totalPages, usePermalinks ) => {
  let firstUrl, lastUrl, nextUrl, prevUrl;
  const directoryPart = directory;

  // Helper function to ensure no double slashes
  const fixUrl = ( url ) => {
    if ( !url ) {
      return null;
    }
    // Replace any double slashes with a single slash
    return url.replace( /\/\//g, '/' );
  };

  if ( usePermalinks ) {
    firstUrl = createCleanUrl( `/${ directoryPart }/index.html` );
    lastUrl = createCleanUrl(
      `/${ outputPattern.replace( ':directory', directoryPart ).replace( ':num', totalPages ) }/index.html`
    );
    nextUrl =
      pageNum < totalPages
        ? createCleanUrl(
          `/${ outputPattern.replace( ':directory', directoryPart ).replace( ':num', pageNum + 1 ) }/index.html`
        )
        : null;
    prevUrl =
      pageNum > 2
        ? createCleanUrl(
          `/${ outputPattern.replace( ':directory', directoryPart ).replace( ':num', pageNum - 1 ) }/index.html`
        )
        : pageNum === 2
          ? firstUrl
          : null;
  } else {
    firstUrl = `/${ directoryPart }.html`;
    lastUrl = `/${ outputPattern.replace( ':directory', directoryPart ).replace( ':num', totalPages ) }.html`;
    nextUrl =
      pageNum < totalPages
        ? `/${ outputPattern.replace( ':directory', directoryPart ).replace( ':num', pageNum + 1 ) }.html`
        : null;
    prevUrl =
      pageNum > 2
        ? `/${ outputPattern.replace( ':directory', directoryPart ).replace( ':num', pageNum - 1 ) }.html`
        : pageNum === 2
          ? firstUrl
          : null;
  }

  return {
    firstUrl: fixUrl( firstUrl ),
    lastUrl: fixUrl( lastUrl ),
    nextUrl: fixUrl( nextUrl ),
    prevUrl: fixUrl( prevUrl )
  };
};

/**
 * Helper function to find the most recent date in a page's files
 * @param {Array} pageFiles - The files on the page
 * @param {string} sortBy - The property to get date from
 * @returns {Date} The most recent date or current date if none found
 */
const findMostRecentDate = ( pageFiles, sortBy ) => {
  let mostRecentDate = null;
  for ( const file of pageFiles ) {
    const fileDate = getNestedProperty( file, sortBy );
    if ( fileDate && fileDate instanceof Date ) {
      mostRecentDate = fileDate;
      break;
    } else if ( fileDate && typeof fileDate === 'string' ) {
      // Try to parse the date string
      const parsedDate = new Date( fileDate );
      if ( !isNaN( parsedDate.getTime() ) ) {
        mostRecentDate = parsedDate;
        break;
      }
    }
  }

  // If we couldn't find a valid date, use current date
  if ( !mostRecentDate ) {
    mostRecentDate = new Date();
  }
  return mostRecentDate;
};

/**
 * Helper function to create file details for pagination metadata
 * @param {Object} fileData - The file data
 * @param {string} newPath - The new path for the file
 * @returns {Object} File details without contents and with clean URL path
 */
const createFileDetails = ( fileData, newPath ) => {
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

/**
 * Helper function to move a file to a new location
 * @param {Object} files - The Metalsmith files object
 * @param {Object} fileData - The file data to move
 * @param {string} oldPath - The original path
 * @param {string} newPath - The new path
 * @param {number} pageNum - The page number
 * @param {number} totalPages - The total number of pages
 * @param {function} debug - The debug function
 * @returns {void}
 */
const moveFile = ( files, fileData, oldPath, newPath, pageNum, totalPages, debug ) => {
  debug( 'Moving file from %s to %s', oldPath, newPath );

  // Create a new file entry with the updated path
  files[ newPath ] = {
    ...fileData,
    originalPath: oldPath,
    pageNumber: pageNum,
    totalPages: totalPages
  };

  // Remove the old file entry
  delete files[ oldPath ];
};

/**
 * Helper function to filter and sort files
 * @param {Object} files - The Metalsmith files object
 * @param {Object} options - The plugin options
 * @param {function} debug - The debug function
 * @returns {Array} The filtered and sorted files
 */
const filterAndSortFiles = ( files, options, debug ) => {
  // Filter files to only those in the specified directory
  const targetFiles = Object.keys( files )
    .filter( ( file ) => file.startsWith( `${ options.directory }/` ) )
    .map( ( file ) => ( {
      path: file,
      ...files[ file ]
    } ) );
  debug( 'Found %d files in directory %s', targetFiles.length, options.directory );
  if ( targetFiles.length === 0 ) {
    return [];
  }

  // Sort the files, supporting nested properties
  targetFiles.sort( ( a, b ) => {
    const aVal = getNestedProperty( a, options.sortBy );
    const bVal = getNestedProperty( b, options.sortBy );
    if ( aVal === undefined && bVal === undefined ) {
      return 0;
    }
    if ( aVal === undefined ) {
      return options.reverse ? -1 : 1;
    }
    if ( bVal === undefined ) {
      return options.reverse ? 1 : -1;
    }
    if ( aVal < bVal ) {
      return options.reverse ? 1 : -1;
    }
    if ( aVal > bVal ) {
      return options.reverse ? -1 : 1;
    }
    return 0;
  } );
  debug( 'Files sorted by %s in %s order', options.sortBy, options.reverse ? 'descending' : 'ascending' );
  return targetFiles;
};

/**
 * Helper function to create pagination metadata
 * @param {string} directory - The directory name
 * @param {number} pageNum - The page number
 * @param {number} totalPages - The total number of pages
 * @param {Array} fileDetails - The file details
 * @param {string} nextUrl - The next page URL
 * @param {string} prevUrl - The previous page URL
 * @param {string} firstUrl - The first page URL
 * @param {string} lastUrl - The last page URL
 * @returns {Object} The pagination metadata
 */
const createPaginationMetadata = ( directory, pageNum, totalPages, fileDetails, nextUrl, prevUrl, firstUrl, lastUrl ) => {
  return {
    name: directory,
    num: pageNum,
    pages: totalPages,
    files: fileDetails,
    next: nextUrl,
    previous: prevUrl,
    first: firstUrl,
    last: lastUrl
  };
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
const processPage = ( files, pageFiles, pageNum, totalPages, options, metadata, debug ) => {
  // Determine page path
  const pagePath = options.outputDir.replace( ':directory', options.directory ).replace( ':num', pageNum );
  const indexFile = `${ pagePath }/index.html`;
  debug( 'Processing page %d with path: %s', pageNum, pagePath );
  const fileDetails = [];

  // Move files to their new locations
  pageFiles.forEach( ( fileData ) => {
    const oldPath = fileData.path;
    const fileName = oldPath.split( '/' ).pop();
    // Get the basename without extension
    const baseName = fileName.replace( /\.[^/.]+$/, '' );
    // Get the original extension
    const extension = fileName.match( /\.[^/.]+$/ ) ? fileName.match( /\.[^/.]+$/ )[ 0 ] : '.html';
    // Create a directory for each blog post
    const newPath = `${ options.directory }/${ baseName }/index${ extension }`;

    // Create a new file entry with the updated path
    moveFile( files, fileData, oldPath, newPath, pageNum, totalPages, debug );

    // Create detailed file data (excluding contents)
    fileDetails.push( createFileDetails( fileData, newPath ) );
  } );

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
const processFirstPage = ( files, firstIndexFiles, totalPages, options, debug ) => {
  debug( 'Processing first page with %d files', firstIndexFiles.length );
  const fileDetails = [];

  // IMPORTANT: Create detailed file data WITH updated paths
  firstIndexFiles.forEach( ( fileData ) => {
    const oldPath = fileData.path;
    const fileName = oldPath.split( '/' ).pop();
    // Get the basename without extension
    const baseName = fileName.replace( /\.[^/.]+$/, '' );
    // Get the original extension
    const extension = fileName.match( /\.[^/.]+$/ ) ? fileName.match( /\.[^/.]+$/ )[ 0 ] : '.html';
    // Create a directory for each blog post
    const newPath = `${ options.directory }/${ baseName }/index${ extension }`;

    // Create detailed file data (excluding contents)
    fileDetails.push( createFileDetails( fileData, newPath ) );
  } );

  // Move files for the first page to the blog directory
  firstIndexFiles.forEach( ( fileData ) => {
    const oldPath = fileData.path;
    const fileName = oldPath.split( '/' ).pop();
    // Get the basename without extension
    const baseName = fileName.replace( /\.[^/.]+$/, '' );
    // Get the original extension
    const extension = fileName.match( /\.[^/.]+$/ ) ? fileName.match( /\.[^/.]+$/ )[ 0 ] : '.html';
    // Create a directory for each blog post
    const newPath = `${ options.directory }/${ baseName }/index${ extension }`;

    // Create a new file entry with the updated path
    moveFile( files, fileData, oldPath, newPath, 1, totalPages, debug );
  } );

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

    // Get the most recent date from the files on this page
    const mostRecentDate = findMostRecentDate( firstIndexFiles, options.sortBy );

    // Create pagination metadata
    const paginationMetadata = createPaginationMetadata(
      options.directory,
      1,
      totalPages,
      fileDetails,
      nextUrl,
      null,
      // No previous page for first page
      firstUrl,
      lastUrl
    );

    // Add pagination metadata to the existing file in metalsmith-pagination format
    files[ options.firstIndexFile ].pagination = paginationMetadata;

    // Add for backward compatibility with our plugin
    files[ options.firstIndexFile ].pageFiles = fileDetails;

    // Update date if needed
    if ( !files[ options.firstIndexFile ].date ) {
      files[ options.firstIndexFile ].date = mostRecentDate;
    }
  } else {
    debug( 'First page file %s does not exist, skipping first page metadata update', options.firstIndexFile );
  }
};

/**
 * @typedef Options
 * @property { string } options.directory Directory containing files to paginate
 * @property { number } options.perPage Number of files per page
 * @property { string} options.sortBy Property to sort by ( e.g., 'date' or 'post.date' )
 * @property { boolean} options.reverse Whether to reverse the sort order
 * @property { string} options.outputDir Directory pattern for output ( e.g., 'blog/:num' )
 * @property { string} options.indexLayout Layout to use for index pages
 * @property { string} options.firstIndexFile Name of first index file ( e.g., 'blog.md' )
 * @property { boolean} options.usePermalinks Whether to use permalinks-style URLs
 */

/** @type {Options} */
const defaults = {
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
function normalizeOptions( options ) {
  return Object.assign( {}, defaults, options || {} );
}


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
