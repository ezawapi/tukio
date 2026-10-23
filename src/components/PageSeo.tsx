import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getPageSeo } from "@/lib/page-seo";

const PageSeo = () => {
  const { pathname } = useLocation();
  // Event details own their metadata after the public/private state has loaded.
  const eventDetail = /^\/events\/[^/]+\/?$/.test(pathname);
  if (eventDetail) return null;
  const seo = getPageSeo(pathname);
  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="robots" content={seo.indexable ? "index, follow, max-image-preview:large" : "noindex, follow"} />
      <link rel="canonical" href={seo.canonical} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={seo.canonical} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
    </Helmet>
  );
};

export default PageSeo;