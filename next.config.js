/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/extract-pdf': [
        './node_modules/pdf-parse/dist/worker/pdf.worker.mjs',
      ],
    },
  },
};

module.exports = nextConfig;
