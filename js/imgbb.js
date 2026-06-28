const WORKER =
    "https://imgbb-upload.adarshvaadii9650.workers.dev/";

export async function uploadToImgBB(blob) {

    const form = new FormData();

    form.append("image", blob, "thumbnail.jpg");

    const res = await fetch(WORKER, {
        method: "POST",
        body: form
    });

    if (!res.ok) {
        throw new Error("Upload failed");
    }

    const json = await res.json();

    return json.url;
}
