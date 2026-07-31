/**
 * Optional Node/serverless-style handler notes.
 * For Cloudflare Workers / Netlify Functions, adapt this logic with Resend/Web3Forms.
 * Classic hosting should use contact.php instead.
 *
 * Env vars:
 *   CONTACT_TO
 *   RESEND_API_KEY (if using Resend)
 *   WEB3FORMS_ACCESS_KEY (if using Web3Forms)
 */
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
    }
    const data = await request.json();
    if (data.website) return Response.json({ ok: true });

    const to = env.CONTACT_TO || "info@leadership-munich.org";
    if (env.WEB3FORMS_ACCESS_KEY) {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: env.WEB3FORMS_ACCESS_KEY,
          subject: `[MLI Website] ${data.subject || "Contact"}`,
          from_name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.comments,
          to,
        }),
      });
      const json = await res.json();
      return Response.json({ ok: !!json.success, error: json.message });
    }

    return Response.json(
      { ok: false, error: "Configure WEB3FORMS_ACCESS_KEY or use contact.php" },
      { status: 501 }
    );
  },
};
