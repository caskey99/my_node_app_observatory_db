const http = require('http');
const fs = require('fs');
const qs = require('querystring');
const Mysql = require('sync-mysql');

const connection = new Mysql({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'ObservatoryDB',
    charset: 'utf8mb4'
});

function reqPost(request, response) {
    if (request.method === 'POST') {
        let body = '';

        request.on('data', (data) => {
            body += data;
        });

        request.on('end', () => {
            const post = qs.parse(body);
            if (post.id && post.action === 'edit') {
                const sUpdate = `UPDATE Sector SET 
                    coordinates = ?,
                    light_intensity = ?,
                    foreign_objects = ?,
                    num_objects = ?,
                    num_undefined_objects = ?,
                    num_defined_objects = ?,
                    note = ?
                    WHERE id = ?`;
                const values = [post.coordinates, post.light_intensity, post.foreign_objects, post.num_objects, post.num_undefined_objects, post.num_defined_objects, post.note, post.id];
                try {
                    connection.query(sUpdate, values);
                    response.writeHead(302, {'Location': '/'});
                    response.end();
                } catch (err) {
                    response.writeHead(500, {'Content-Type': 'text/html'});
                    response.end('Ошибка при обновлении записи: ' + err.message);
                }
            } else if (post.id && post.action === 'delete') {
                const sDelete = `DELETE FROM Sector WHERE id = ?`;
                const values = [post.id];
                try {
                    connection.query(sDelete, values);
                    response.writeHead(302, {'Location': '/'});
                    response.end();
                } catch (err) {
                    response.writeHead(500, {'Content-Type': 'text/html'});
                    response.end('Ошибка при удалении записи: ' + err.message);
                }
            } else if (post.action === 'add') {
                const sInsert = `INSERT INTO Sector (coordinates, light_intensity, foreign_objects, num_objects, num_undefined_objects, num_defined_objects, note) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                const values = [post.coordinates, post.light_intensity, post.foreign_objects, post.num_objects, post.num_undefined_objects, post.num_defined_objects, post.note];
                try {
                    connection.query(sInsert, values);
                    response.writeHead(302, {'Location': '/'});
                    response.end();
                } catch (err) {
                    response.writeHead(500, {'Content-Type': 'text/html'});
                    response.end('Ошибка при добавлении записи: ' + err.message);
                }
            }
        });
    }
}

function ViewSelect(res) {
    try {
        const results = connection.query('SHOW COLUMNS FROM Sector');
        res.write('<tr>');
        results.forEach(result => {
            res.write('<th>' + result.Field + '</th>');
        });
        res.write('<th>Действия</th>');
        res.write('</tr>');

        const rows = connection.query('SELECT * FROM Sector ORDER BY id DESC');
        rows.forEach(row => {
            res.write(`<tr>
                <td>${row.id}</td>
                <td>${row.coordinates}</td>
                <td>${row.light_intensity}</td>
                <td>${row.foreign_objects}</td>
                <td>${row.num_objects}</td>
                <td>${row.num_undefined_objects}</td>
                <td>${row.num_defined_objects}</td>
                <td>${row.note}</td>
                <td>
                    <button onclick="editRecord(${row.id}, '${row.coordinates}', ${row.light_intensity}, ${row.foreign_objects}, ${row.num_objects}, ${row.num_undefined_objects}, ${row.num_defined_objects}, '${row.note}')">Изменить</button>
                    <button onclick="deleteRecord(${row.id})">Удалить</button>
                </td>
            </tr>`);
        });
    } catch (err) {
        res.write('<tr><td colspan="9">Ошибка при запросе к базе данных: ' + err.message + '</td></tr>');
    }
}

function ViewVer(res) {
    try {
        const results = connection.query('SELECT VERSION() AS ver');
        res.write(results[0].ver);
    } catch (err) {
        res.write('Ошибка при запросе к базе данных: ' + err.message);
    }
}

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        reqPost(req, res);
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');

        const array = fs.readFileSync(__dirname + '\\select.html').toString().split('\n');
        array.forEach(line => {
            if (line.trim() !== '@tr' && line.trim() !== '@ver') res.write(line);
            if (line.trim() === '@tr') ViewSelect(res);
            if (line.trim() === '@ver') ViewVer(res);
        });
        res.end();
    }
});

const hostname = '127.0.0.1';
const port = 3000;
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
