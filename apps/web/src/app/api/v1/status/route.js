import database from "@wefood/database";

export async function GET() {
  const updatedAt = new Date().toISOString();

  try {
    await database.query("SELECT 1;");
    return Response.json({
      updated_at: updatedAt,
      dependencies: { database: { status: "healthy" } },
    });
  } catch {
    return Response.json(
      {
        updated_at: updatedAt,
        dependencies: { database: { status: "unhealthy" } },
      },
      { status: 503 },
    );
  }
}
