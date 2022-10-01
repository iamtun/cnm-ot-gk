const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");

const PORT = process.env.PORT || 3000;
const app = express();

//config
dotenv.config();
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./views");

//config - aws
const config = new AWS.Config({
  accessKeyId: process.env.ACCESSKEYID,
  secretAccessKey: process.env.SECRETACCESSKEY,
  region: process.env.REGION,
});

AWS.config = config;

//create connect
const docs = new AWS.DynamoDB.DocumentClient();
const tableName = "Papers";

//routers
app.get("/", (req, res) => {
  const params = {
    TableName: tableName,
  };

  docs.scan(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.render("index", { items: data.Items.sort((a, b) => a.id - b.id) });
    }
  });
});

app.get("/add", (req, res) => {
  res.render("add");
});

const isIdExists = async (id) => {
  await docs.scan({ TableName: tableName }, (err, data) => {
    if (err) {
      console.log(`post: ${err}`);
    } else {
      //console.log(!data.Items.filter((item) => item.id == id) === true);
      if (data.Items.filter((item) => item.id == id)) {
        return true;
      }
      return false;
    }
  });
};

const validate = async(id, name, author, isbn, page, year) => {
  const errors = [];
  //validate
  if (!id || !name || !author || !isbn || !page || !year) {
    errors.push({ msg: "You must enter full input" });
  }

  if (parseInt(id) < 0) {
    errors.push({ msg: "id must > 0" });
  }

  if (await isIdExists(id)) {
    errors.push({ msg: "id exists" });
  }

  if (parseInt(page) < 0) {
    errors.push({ msg: "page must > 0" });
  }

  if (parseInt(year) < 0) {
    errors.push({ msg: "year must > 0" });
  }

  if (!isbn.match("[0-9]{3}-[0-9]{3}-[0-9]{3}")) {
    errors.push({ msg: "isbn eror. ex: 111-222-333" });
  }

  return errors;
};

app.post("/papers", (req, res) => {
  console.log(req.body);
  const { id, name, author, isbn, page, year } = req.body;
  const errors = validate(id, name, author, isbn, page, year);

  if (errors.length > 0) {
    res.render("add", { errors });
  } else {
    const params = {
      TableName: tableName,
      Item: {
        id: parseInt(id),
        name,
        author,
        isbn,
        page,
        year,
      },
    };

    docs.put(params, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  }
});

app.get("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const params = {
    TableName: tableName,
    Key: { id },
  };
  docs.delete(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.listen(PORT, () => console.log(`app listening port ${PORT}`));
