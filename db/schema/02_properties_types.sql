DROP TABLE IF EXISTS product_types CASCADE;
DROP TABLE IF EXISTS properties_types CASCADE;
CREATE TABLE properties_types (
id SERIAL PRIMARY KEY NOT NULL,
name VARCHAR (255)
);