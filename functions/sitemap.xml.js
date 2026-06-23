export async function onRequest() {
  const res = await fetch(
    "https://snuwaxtrhogfrhselwow.supabase.co/rest/v1/rpc/generate_sitemap?apikey=sb_publishable_YUR6o4bQT4FavQgc62oWNQ_O9G-qpD3",
    {
      method: "POST"
    }
  );

  let xml = await res.text();

  xml = xml
    .replace(/^"/, "")
    .replace(/"$/, "")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"');

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache"
    }
  });
}
