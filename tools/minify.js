// minify each game file separately (top-level names are kept, since files share globals)
// usage: node tools/minify.js <in1> <in2> ... → prints a JSON array of minified sources
const { minify } = require('terser');
const fs = require('fs');
(async () => {
  const out = [];
  for (const f of process.argv.slice(2)) {
    const src = fs.readFileSync(f, 'utf8');
    try {
      const r = await minify(src, { toplevel: false, compress: { passes: 1, keep_fargs: true, keep_fnames: true, toplevel: false, unused: false }, mangle: { toplevel: false, keep_fnames: true }, format: { comments: false } });
      out.push(r.code);
    } catch (e) { console.error('minify failed', f, e.message); out.push(src); }
  }
  process.stdout.write(JSON.stringify(out));
})();
