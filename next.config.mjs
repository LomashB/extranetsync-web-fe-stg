/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["pravljiceais3.s3.eu-central-1.amazonaws.com",
      "lh3.googleusercontent.com",
      "storage.googleapis.com"
    ],
  },
};

export default nextConfig;
