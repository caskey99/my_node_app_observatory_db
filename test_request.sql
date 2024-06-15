INSERT INTO Sector (coordinates, light_intensity, foreign_objects, num_objects, num_undefined_objects, num_defined_objects, note)
VALUES ('coordinates_1', 100.0, 5, 10, 3, 7, 'noteeee_1');

INSERT INTO Object (sector_id, type, accuracy, quantity, time, date, note)
VALUES (1, 'type1', 99.9, 10, '12:00:00', '2024-06-14', 'noteeee_1');

UPDATE Object SET type = 'type2' WHERE id = 1;

SELECT * FROM Object WHERE id = 1;

CALL join_tables('Sector', 'Object');