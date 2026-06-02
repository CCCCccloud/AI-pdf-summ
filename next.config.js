/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/extract-pdf': [
        './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      ],
    },
  },
};

module.exports = nextConfig;
