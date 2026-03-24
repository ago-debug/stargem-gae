const mysql = require("mysql2/promise");
require("dotenv").config();

async function migratePermissions() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("Connected to database.");

    try {
        const [roles] = await connection.execute("SELECT id, name, permissions FROM user_roles");
        console.log(`Found ${roles.length} roles.`);

        for (const role of roles) {
            let permissions = role.permissions;
            if (typeof permissions === 'string') {
                permissions = JSON.parse(permissions);
            }

            let updated = false;

            // Map old URLs to new URLs
            const mappings = {
                "/categorie": "/categorie-corsi",
                "/categorie-clienti": "/categoria-partecipante"
            };

            for (const [oldPath, newPath] of Object.entries(mappings)) {
                if (permissions[oldPath]) {
                    console.log(`Role "${role.name}": renaming ${oldPath} to ${newPath}`);
                    permissions[newPath] = permissions[oldPath];
                    delete permissions[oldPath];
                    updated = true;
                }
            }

            if (updated) {
                const updatedPermissions = JSON.stringify(permissions);
                await connection.execute(
                    "UPDATE user_roles SET permissions = ?, updated_at = NOW() WHERE id = ?",
                    [updatedPermissions, role.id]
                );
                console.log(`Role "${role.name}" updated.`);
            } else {
                console.log(`Role "${role.name}" already up to date or no matching keys found.`);
            }
        }

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migratePermissions();
