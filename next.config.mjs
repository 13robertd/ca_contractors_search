import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Next doesn't get confused by stray lockfiles
  // higher up the filesystem (e.g. on your Desktop during development).
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
