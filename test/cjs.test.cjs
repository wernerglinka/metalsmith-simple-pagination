/* global describe, it */

const assert = require('node:assert').strict;

// Import the plugin using CommonJS format
const simplePagination = require('../lib/index.cjs');

// Import metalsmith
const Metalsmith = require('metalsmith');

describe('metalsmith-simple-pagination (CommonJS)', () => {
  // Verify the module loads correctly and exports a function
  it('should be properly importable as a CommonJS module', () => {
    assert.strictEqual(typeof simplePagination, 'function', 'Plugin should be a function when required with CommonJS');
    assert.strictEqual(typeof simplePagination(), 'function', 'Plugin should return a function when called');
  });
  
  // Basic functionality test to verify the plugin works with CommonJS
  it('should run without errors in CommonJS', (done) => {
    // Create mock blog posts
    const files = {
      'blog/post1.md': {
        title: 'Post 1',
        date: new Date('2022-01-01'),
        contents: Buffer.from('# Post 1')
      },
      'blog.md': {
        title: 'Blog Index',
        contents: Buffer.from('# Blog')
      }
    };
    
    // Create metalsmith instance
    const ms = Metalsmith('/tmp').metadata({});
    
    // Run the plugin with default options
    const plugin = simplePagination();
    
    plugin(files, ms, (err) => {
      if (err) {return done(err);}
      
      // Just make sure it didn't throw an error
      done();
    });
  });
});