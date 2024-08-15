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

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

var ct_code;
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

var result;
app.post("/add", async (req, res) => {
  const country = req.body.country;
  try {
    ct_code = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
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
      const query = "INSERT INTO visited_countries (country_code) VALUES ($1)";
      // console.log(query);
      db.query(query, [result], (err, result) => {
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
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.error(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
