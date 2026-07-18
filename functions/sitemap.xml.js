export async function onRequest() {
  const res = await fetch(
    "https://jaeshacdzvlalgdpflvr.supabase.co/rest/v1/rpc/generate_sitemap?apikey=sb_publishable_9xcKEzggpMVIqB13eknXrQ_1NCg3OBo",
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
