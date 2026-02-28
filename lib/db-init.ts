import postgres from "postgres";
import fs from "fs";
import path from "path";

export async function initDatabase() {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("No database connection string found");
    return;
  }

  const sql = postgres(connectionString, {
    ssl: "require",
  });

  try {
    // Check if the releases table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'releases'
      );
    `;

    if (!result[0].exists) {
      console.log("Database tables not found. Initializing...");
      const sqlPath = path.join(process.cwd(), "scripts", "init-db.sql");
      const sqlContent = fs.readFileSync(sqlPath, "utf8");

      // Split the SQL content by semicolons and execute each statement
      // Note: This is a simple splitter and might fail with complex SQL (like functions)
      // but for this init-db.sql it should be mostly fine if we use the whole file.
      // postgres-js allows running multiple statements if configured or just passing the whole string.
      await sql.unsafe(sqlContent);
      console.log("Database initialization completed successfully.");

      // Refresh PostgREST schema cache if possible (specific to Supabase)
      // This is often not possible via client, but some setups allow NOTIFY pgrst, 'reload schema'
      try {
        await sql`NOTIFY pgrst, 'reload schema'`;
      } catch (e) {
        console.warn(
          "Could not notify PostgREST to reload schema. Cache might be stale for a few minutes.",
        );
      }
    } else {
      console.log("Database tables already exist.");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    await sql.end();
  }
}
