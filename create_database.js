const mysql = require('mysql2/promise');

async function createDatabaseAndTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin'
    });

    try {
        await connection.query('DROP DATABASE IF EXISTS ObservatoryDB');
        await connection.query('CREATE DATABASE ObservatoryDB');
        console.log("База данных ObservatoryDB успешно создана");

        await connection.changeUser({ database: 'ObservatoryDB' });

        await createSectorTable(connection);
        await createObjectTable(connection);
        await createNaturalObjectTable(connection);
        await createPositionTable(connection);
        await createAssociationTable(connection);

        // Создадим триггер для таблицы Object
        await createUpdateTriggerForObject(connection);

        // Создадим процедуры для объединения выборки из двух таблиц
        await createJoinTablesProcedure(connection);

        console.log("Таблицы, триггеры и процедуры успешно созданы!");
    } catch (error) {
        console.error("Ошибка при создании БД и таблиц:", error);
    } finally {
        await connection.end();
    }
}

async function createSectorTable(connection) {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Sector (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coordinates VARCHAR(255),
                light_intensity FLOAT,
                foreign_objects INT,
                num_objects INT,
                num_undefined_objects INT,
                num_defined_objects INT,
                note TEXT
            )
        `);
        console.log("Таблица Sector создана успешно");
    } catch (error) {
        throw new Error(`Ошибка при создании таблицы Sector: ${error.message}`);
    }
}

async function createObjectTable(connection) {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Object (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sector_id INT,
                type VARCHAR(255),
                accuracy FLOAT,
                quantity INT,
                time TIME,
                date DATE,
                note TEXT,
                date_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sector_id) REFERENCES Sector(id)
            )
        `);
        console.log("Таблица Object создана успешно");
    } catch (error) {
        throw new Error(`Ошибка при создании таблицы Object: ${error.message}`);
    }
}

async function createNaturalObjectTable(connection) {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS NaturalObject (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(255),
                galaxy VARCHAR(255),
                accuracy FLOAT,
                light_flow FLOAT,
                associated_objects INT,
                note TEXT
            )
        `);
        console.log("Таблица NaturalObject создана успешно");
    } catch (error) {
        throw new Error(`Ошибка при создании таблицы NaturalObject: ${error.message}`);
    }
}

async function createPositionTable(connection) {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Position (
                id INT AUTO_INCREMENT PRIMARY KEY,
                earth_position VARCHAR(255),
                sun_position VARCHAR(255),
                moon_position VARCHAR(255)
            )
        `);
        console.log("Таблица Position создана успешно");
    } catch (error) {
        throw new Error(`Ошибка при создании таблицы Position: ${error.message}`);
    }
}

async function createAssociationTable(connection) {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`Association\` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sector_id INT,
                object_id INT,
                natural_object_id INT,
                position_id INT,
                FOREIGN KEY (sector_id) REFERENCES \`Sector\`(id),
                FOREIGN KEY (object_id) REFERENCES \`Object\`(id),
                FOREIGN KEY (natural_object_id) REFERENCES \`NaturalObject\`(id),
                FOREIGN KEY (position_id) REFERENCES \`Position\`(id)
            )
        `);
        console.log("Таблица Association создана успешно");
    } catch (error) {
        throw new Error(`Ошибка при создании таблицы Association: ${error.message}`);
    }
}

async function createUpdateTriggerForObject(connection) {
    try {
        await connection.query(`
            CREATE TRIGGER update_object_trigger
            AFTER UPDATE ON Object
            FOR EACH ROW
            BEGIN
                UPDATE Object SET date_update = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `);
        console.log("Триггер для таблицы Object создан успешно");
    } catch (error) {
        throw new Error(`Ошибка при создании триггера для таблицы Object: ${error.message}`);
    }
}

async function createJoinTablesProcedure(connection) {
    try {
        await connection.query(`
            CREATE PROCEDURE join_tables(IN table1 VARCHAR(255), IN table2 VARCHAR(255))
            BEGIN
                SET @query = CONCAT('SELECT * FROM ', table1, ' t1 JOIN ', table2, ' t2 ON t1.id = t2.id');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END;
        `);
        console.log("Процедура join_tables создана успешно");
    } catch (error) {
        throw new Error(`Ошибка при создании процедуры join_tables: ${error.message}`);
    }
}

createDatabaseAndTables().catch(err => {
    console.error('Ошибка создания БД', err);
});
