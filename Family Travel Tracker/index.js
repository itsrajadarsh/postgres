import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "password",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "X", color: "X" }, //  sample only
  { id: 2, name: "X", color: "X" }, // sample only
];

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
var ct_code;
var result;
app.post("/add", async (req, res) => {
  const country = req.body.country;
  const currentUser = await getCurrentUser();

  try {
    ct_code = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [`${country.toLowerCase()}`]
    );
    result = ct_code.rows[0].country_code;
    // console.log(result);
    // console.log(ct_code);

    try {
      const ct = await checkVisisted();
      if (ct.includes(`${result}`) || result == []) {
        // res.send("Country already visited");
        // console.log(ct);
        throw new Error("Country already visited");
      }
      const query =
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)";
      // console.log(query);
      db.query(query, [result, currentUserId], (err, result) => {
        res.redirect("/");
        // console.log("hello test 2 ");
      });
    } catch (err) {
      console.error(err);
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.error(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser.color,
      error: "Country name does not exist, try again.",
    });
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    // console.log(currentUserId);

    res.redirect("/");
  }
});
app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
