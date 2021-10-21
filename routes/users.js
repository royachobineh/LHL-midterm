/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into /users,
 *   these routes are mounted onto /
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

  //Rendering the favorite page
  router.get("/favorites", (req, res) => {
    const sqlQuery = `SELECT favorite_properties.id AS favorite_id, properties.photo_1, properties.title, properties.price, properties.id AS properties_id, user_id FROM favorite_properties INNER JOIN properties ON properties.id = favorite_properties.properties_id
    WHERE favorite_properties.user_id = $1;`;
    let userId = req.session.user_id;
    const values = [userId];
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

  //Inserting products into favorites list if user clicks on favorite this
  router.post("/favorites/:properties_id", (req, res) => {
    const propertyId = req.params.properties_id;
    const userId = req.session.user_id;
    const sqlQuery = `INSERT INTO favorite_properties (properties_id, user_id) VALUES ($1, $2)`;
    const values = [propertyId, userId];
    console.log(values)
    if (userId) {
      db.query(sqlQuery, values)
        .then((data) => {
          console.log("data", data);
          res.redirect("/");
        })
        .catch((err) => {
          console.log("error", err);
          res.status(500).json({ err: err.message });
        });
    }
  });

  //Removing favorite product from user
  router.post("/favorite/:favorite_properties_id/delete", (req, res) => {
    const sqlQuery = `DELETE FROM favorite_properties WHERE id = $1;`;
    const values = [req.params.favorite_properties.properties_id];
    console.log(values)
    console.log(sqlQuery)
    // db.query(sqlQuery, values)
    //   .then((data) => {
    //     res.redirect("/users/favorite/");
    //   })
    //   .catch((err) => {
    //     res.status(500).json({ err: err.message });
    //   });
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

  //Rendering the new message page
  router.get("/properties/:properties_id/message", (req, res) => {
    const user_email = req.session.user_email;
    const userId = req.session.user_id;
    const propertiesId = req.params.properties_id;
    const sqlQuery = `SELECT * FROM properties WHERE id = $1;`;
    const values = [propertiesId];
    db.query(sqlQuery, values)
      .then((data) => {
        const properties = data.rows[0];
        const templateVars = { user_email, userId, properties };
        res.render("new_message", templateVars);
      })
      .catch((err) => {
        res.status(500).json({ err: err.message });
      });
  });

  //Creating a new message for the properties
  router.post("/properties/:properties_id/message", (req, res) => {
    const sqlQuery = `INSERT INTO messages (user_id, content, properties_id) VALUES ($1, $2, $3);`;
    const userId = req.session.user_id;
    const message = req.body.name;
    const propertiesId = req.params.properties_id;
    const values = [userId, message, propertiesId];
    db.query(sqlQuery, values)
      .then((data) => {
        res.redirect("/");
      })
      .catch((err) => {
        res.status(500).json({ err: err.message });
      });
  });

  return router;
};
