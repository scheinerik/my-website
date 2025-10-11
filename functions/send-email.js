export async function onRequestPost(context) {
  try {
    const { name, email, message } = await context.request.json();
    if (!name || !email || !message) {
      return new Response("Missing fields", { status: 400 });
    }

    const mail = {
      personalizations: [{ to: [{ email: "contact@scheinerik.dev" }] }],
      from: { email: "contact@scheinerik.dev", name: "Website Contact Form" },
      subject: `New message from ${name}`,
      content: [
        {
          type: "text/plain",
          value: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        },
      ],
    };

    const resp = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mail),
    });

    if (resp.ok) return new Response("OK", { status: 200 });

    console.error("MailChannels error:", await resp.text());
    return new Response("Mail send failed", { status: 500 });
  } catch (err) {
    console.error("Function error:", err);
    return new Response("Server error", { status: 500 });
  }
}