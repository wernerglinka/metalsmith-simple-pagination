import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Import the plugin directly from src for accurate coverage
import simplePagination from '../src/index.js';

// Get current directory and setup path utilities
const __dirname = dirname( fileURLToPath( import.meta.url ) );

/**
 * Creates a path resolver for a specific fixture directory
 * @param {string} dir - The fixture directory name
 * @returns {Function} A function that resolves paths within the fixture directory
 */
const getFixturePath = ( dir ) => resolve.bind( null, __dirname, `fixtures/${dir}` );

// Get fixture path resolver
getFixturePath;

// Import metalsmith
import Metalsmith from 'metalsmith';

describe( 'metalsmith-simple-pagination (ESM)', function () {
  // Set timeout for all tests
  this.timeout( 5000 );

  // Verify ESM module loading
  it( 'should be importable as an ES module', () => {
    assert.strictEqual( typeof simplePagination, 'function', 'Plugin should be a function when imported with ESM' );
    assert.strictEqual( typeof simplePagination(), 'function', 'Plugin should return a function when called' );
  } );

  describe( 'Basic Functionality', () => {
    it( 'should run without errors', ( done ) => {
      // Create mock blog posts
      const files = {
        'blog/post1.md': {
          title: 'Post 1',
          date: new Date( '2022-01-01' ),
          contents: Buffer.from( '# Post 1' )
        },
        'blog.md': {
          title: 'Blog Index',
          contents: Buffer.from( '# Blog' )
        }
      };

      // Create metalsmith instance
      const metalsmith = Metalsmith( '/tmp' ).metadata( {} );

      // Run the plugin with default options
      simplePagination()( files, metalsmith, ( err ) => {
        if ( err ) {
          return done( err );
        }

        // Just make sure it didn't throw an error
        done();
      } );
    } );

    it( 'should handle usePermalinks=false option', ( done ) => {
      // Create mock blog posts
      const files = {
        'blog/post1.md': {
          title: 'Post 1',
          date: new Date( '2022-01-01' ),
          contents: Buffer.from( '# Post 1' )
        },
        'blog/post2.md': {
          title: 'Post 2',
          date: new Date( '2022-01-02' ),
          contents: Buffer.from( '# Post 2' )
        },
        'blog/post3.md': {
          title: 'Post 3',
          date: new Date( '2022-01-03' ),
          contents: Buffer.from( '# Post 3' )
        },
        'blog/post4.md': {
          title: 'Post 4',
          date: new Date( '2022-01-04' ),
          contents: Buffer.from( '# Post 4' )
        },
        'blog.md': {
          title: 'Blog Index',
          contents: Buffer.from( '# Blog' )
        }
      };

      // Create metalsmith instance
      const metalsmith = Metalsmith( '/tmp' ).metadata( {} );

      // Run the plugin with usePermalinks=false
      simplePagination( {
        perPage: 2,
        usePermalinks: false
      } )( files, metalsmith, ( err ) => {
        if ( err ) {
          return done( err );
        }

        try {
          // Check pagination URLs use .html format
          assert.strictEqual( files['blog.md'].pagination.next, '/blog/2.html' );
          assert.strictEqual( files['blog/2.html'].pagination.previous, '/blog.html' );
          assert.strictEqual( files['blog/2.html'].pagination.first, '/blog.html' );

          done();
        } catch ( error ) {
          done( error );
        }
      } );
    } );

    it( 'should handle custom firstIndexFile option', ( done ) => {
      // Create mock blog posts
      const files = {
        'blog/post1.md': {
          title: 'Post 1',
          date: new Date( '2022-01-01' ),
          contents: Buffer.from( '# Post 1' )
        },
        'blog/post2.md': {
          title: 'Post 2',
          date: new Date( '2022-01-02' ),
          contents: Buffer.from( '# Post 2' )
        },
        'custom-blog-index.md': {
          title: 'Custom Blog Index',
          contents: Buffer.from( '# Custom Blog' )
        }
      };

      // Create metalsmith instance
      const metalsmith = Metalsmith( '/tmp' ).metadata( {} );

      // Run the plugin with custom firstIndexFile
      simplePagination( {
        firstIndexFile: 'custom-blog-index.md'
      } )( files, metalsmith, ( err ) => {
        if ( err ) {
          return done( err );
        }

        try {
          // Check that custom-blog-index.md got pagination metadata
          assert( files['custom-blog-index.md'].pagination !== undefined, 'pagination should exist' );
          assert.strictEqual( files['custom-blog-index.md'].pagination.num, 1 );
          assert( Array.isArray( files['custom-blog-index.md'].pagination.files ), 'pagination.files should be an array' );
          assert.strictEqual( files['custom-blog-index.md'].pagination.files.length, 2 );

          done();
        } catch ( error ) {
          done( error );
        }
      } );
    } );

    it( 'should handle no pagination needed (empty directory)', ( done ) => {
      // Create files with no blog posts
      const files = {
        'other/file.md': {
          title: 'Other File',
          contents: Buffer.from( '# Other File' )
        },
        'blog.md': {
          title: 'Blog Index',
          contents: Buffer.from( '# Blog' )
        }
      };

      // Create metalsmith instance
      const metalsmith = Metalsmith( '/tmp' ).metadata( {} );

      // Run the plugin
      simplePagination()( files, metalsmith, ( err ) => {
        if ( err ) {
          return done( err );
        }

        try {
          // No blog files should be created or moved
          assert( files['other/file.md'] !== undefined, 'other/file.md should exist' );
          assert( files['blog.md'] !== undefined, 'blog.md should exist' );
          assert( files['blog.md'].pagination === undefined, 'blog.md should not have pagination metadata' );

          done();
        } catch ( error ) {
          done( error );
        }
      } );
    } );

    it( 'should preserve metalsmith global metadata', ( done ) => {
      // Create mock blog posts
      const files = {
        'blog/post1.md': {
          title: 'Post 1',
          date: new Date( '2022-01-01' ),
          contents: Buffer.from( '# Post 1' )
        },
        'blog/post2.md': {
          title: 'Post 2',
          date: new Date( '2022-01-02' ),
          contents: Buffer.from( '# Post 2' )
        },
        'blog.md': {
          title: 'Blog Index',
          contents: Buffer.from( '# Blog' )
        }
      };

      // Create metalsmith instance with global metadata
      const globalMetadata = {
        siteName: 'Test Site',
        siteUrl: 'https://example.com'
      };
      const metalsmith = Metalsmith( '/tmp' ).metadata( globalMetadata );

      // Run the plugin with perPage=1 to create multiple pages
      simplePagination( {
        perPage: 1
      } )( files, metalsmith, ( err ) => {
        if ( err ) {
          return done( err );
        }

        try {
          // Check global metadata was added to index pages
          assert.strictEqual( files['blog/2/index.html'].siteName, 'Test Site' );
          assert.strictEqual( files['blog/2/index.html'].siteUrl, 'https://example.com' );

          done();
        } catch ( error ) {
          done( error );
        }
      } );
    } );
  } );
} );
