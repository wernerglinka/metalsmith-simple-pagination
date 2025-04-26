import { getNestedProperty } from './helpers.js';

/**
 * Helper function to filter and sort files
 * @param {Object} files - The Metalsmith files object
 * @param {Object} options - The plugin options
 * @param {function} debug - The debug function
 * @returns {Array} The filtered and sorted files
 */
export const filterAndSortFiles = ( files, options, debug ) => {
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
 * Helper function to move a file to a new location
 * @param {Object} files - The Metalsmith files object
 * @param {Object} pageFile - The file data to move
 * @param {string} oldPath - The original path
 * @param {string} newPath - The new path
 * @param {number} pageNum - The page number
 * @param {number} totalPages - The total number of pages
 * @param {function} debug - The debug function
 * @returns {void}
 */
export const moveFile = ( files, pageFile, oldPath, newPath, pageNum, totalPages, debug ) => {
  debug( 'Moving file from %s to %s', oldPath, newPath );

  // Create a new file entry with the updated path
  files[ newPath ] = {
    ...pageFile,
    originalPath: oldPath,
    pageNumber: pageNum,
    totalPages: totalPages
  };

  // Remove the old file entry
  delete files[ oldPath ];
};