const LOCAL = "http://127.0.0.1:4321";
const pages = [
  "/",
  "/team/",
  "/kontakt/",
  "/keynotes-und-speaker/",
  "/stark-in-fuehrung/",
  "/en/",
  "/leadership-stories/",
  "/leitbild-und-strategieentwicklung/",
  "/newsletter/",
];

for (const p of pages) {
  const html = await (await fetch(LOCAL + p)).text();
  const assets = new Set();
  for (const m of html.matchAll(/(?:src|href|poster)=["'](\/[^"']+)["']/g)) {
    assets.add(m[1].split("?")[0]);
  }
  let broken = 0;
  const samples = [];
  for (const a of assets) {
    if (a.startsWith("/modules/")) continue;
    const st = (await fetch(LOCAL + a)).status;
    if (st !== 200) {
      broken++;
      if (samples.length < 6) samples.push([st, a]);
    }
  }
  console.log(p, "broken", broken, JSON.stringify(samples));
}
