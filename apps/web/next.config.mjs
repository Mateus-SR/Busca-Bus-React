/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@busca-bus/core"],
  reactCompiler: true,
};

export default nextConfig;
