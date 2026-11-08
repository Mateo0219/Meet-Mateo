/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || (["build", "start"].includes(process.env.npm_lifecycle_event) ? ".next-build" : ".next"),
}

module.exports = nextConfig
