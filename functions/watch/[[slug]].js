export async function onRequest(context) {
  const url = new URL(context.request.url);

  // /watch/anything-here
  const slug = context.params.slug;

  // If no slug, open normal watch page
  if (!slug) {
    return context.env.ASSETS.fetch(
      new Request(new URL("/watch.html", url))
    );
  }

  // Rewrite internally
  url.pathname = "/watch.html";
  url.searchParams.set("slug", slug);

  return context.env.ASSETS.fetch(
    new Request(url)
  );
}
