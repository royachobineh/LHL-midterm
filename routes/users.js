/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router  = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
    db.query(`SELECT * FROM users;`)
      .then(data => {
        const users = data.rows;
        res.json({ users });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //inserting products into favourites list if user clicks on favorite this
  router.post("/favorites/:properties_id", (req, res) => {
    const propertyId = req.params.properties_id;
    const userId = 1;
    const sqlQuery = `INSERT INTO favorite_properties (properties_id, user_id) VALUES ($1, $2)`;
    const values = [propertyId, userId];
    db.query(sqlQuery, values)
      .then((data) => {
        console.log("data", data);
        res.redirect("/");
      })
      .catch((err) => {
        console.log("error", err);
        res.status(500).json({ err: err.message });
      });
  });

  //Rendering the favorite page
  router.get("/favorites", (req, res) => {
    const sqlQuery = `SELECT favorite_properties.id AS favorite_id, properties.photo_1, properties.title, properties.price, properties.id AS properties_id, user_id FROM favorite_properties INNER JOIN properties ON properties.id = favorite_properties.properties_id
    WHERE favorite_properties.user_id = $1;`;
    let userId = req.session.user_id;
    const values = [userId];
    console.log(values);
    db.query(sqlQuery, values)
      .then((data) => {
        const user_email = req.session.user_email;
        const user_id = req.session.user_id;
        const isAdmin = req.session.isAdmin;
        const templateVars = { favorites: data.rows, user_id, user_email, isAdmin };
        res.render("favorites", templateVars);
      })
      .catch((err) => {
        res.status(500).json({ err: err.message });
      });
    });

        //Filtering properties by price
  router.post("/filter", (req, res) => {
    let sqlQuery = `SELECT properties.id, properties.title as properties_title, properties.price AS properties_price, properties.description as description, properties.photo_1 as properties_photo FROM properties_types JOIN properties ON properties.type_id = properties_types.id`;
    const min = req.body.minprice;
    const max = req.body.maxprice;
    const values = [];
    if (min && !max) {
      sqlQuery += ` WHERE properties.price > $1 ORDER BY properties.price;`;
      values.push(min);
    } else if (!min && max) {
      sqlQuery += ` WHERE properties.price < $1 ORDER BY properties.price;`;
      values.push(max);
    } else if (!min && !max) {
      sqlQuery += ` WHERE properties.price > 0 ORDER BY properties.price;`;
    } else {
      sqlQuery += ` WHERE properties.price > $1 and properties.price < $2 ORDER BY properties.price;`;
      values.push(min);
      values.push(max);
    }
    const user_email = req.session.user_email;
    const userId = req.session.user_id;
    db.query(sqlQuery, values)
      .then((data) => {
        const properties = data.rows[0];
        const templateVars = { userId, user_email, properties };
        res.render("filter", templateVars);
      })
      .catch((err) => {
        res.status(500).json({ err: err.message });
      });
  });
  return router;
};
