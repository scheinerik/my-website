export async function onRequest(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // GET all events
  if (context.request.method === "GET") {
    const { results } = await db.prepare("SELECT * FROM events").all();
    return Response.json(results);
  }

  // POST add new event
  if (context.request.method === "POST") {
    const data = await context.request.json();
    const { year, month, day, start, end, title } = data;

    await db
      .prepare(
        "INSERT INTO events (year, month, day, start, end, title) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(year, month, day, start, end, title)
      .run();

    return Response.json({ success: true });
  }

  // PUT update existing event
  if (context.request.method === "PUT") {
    const data = await context.request.json();
    const { id, start, end, title } = data;
    await db
      .prepare(
        "UPDATE events SET start = ?, end = ?, title = ? WHERE id = ?"
      )
      .bind(start, end, title, id)
      .run();
    return Response.json({ success: true, updated: id });
  }

  // DELETE event by id → /api/events?id=3
  if (context.request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400 });
    await db.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
    return Response.json({ success: true, deleted: id });
  }

  return new Response("Method not allowed", { status: 405 });
}