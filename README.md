### 1. download libraries

`npm i express nodemon ejs dotenv body-parser aws-sdk`

### 2. init app

```js
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

app.get("/", (req, res) => {
  res.send("hi");
});
app.listen(PORT, () => console.log(`app listening port ${PORT}`));
```

### 3. config aws

```js
//config - aws
const config = new AWS.Config({
  accessKeyId: process.env.ACCESSKEYID,
  secretAccessKey: process.env.SECRETACCESSKEY,
  region: process.env.REGION,
});

AWS.config = config;

//create connect
const docs = new AWS.DynamoDB.DocumentClient();
const tableName = "[TABLENAME]";
```

### 4. init views

```js
    //loop - index.js
     <%
        for(let paper of items) {%>
        <tr>
            <td>
                <%=paper.id%>
            </td>
            <td>
                <%=paper.name%>
            </td>
            <td>
                <%=paper.author%>
            </td>
            <td>
                <%=paper.isbn%>
            </td>
            <td>
                <%=paper.page%>
            </td>
            <td>
                <%=paper.year%>
            </td>
            <td>
                <a href="/delete/<%=paper.id%>">Xóa</a>
            </td>
        </tr>
        <%}
    %>
```

### 5. routers

```js
    //index.ejs
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

    //add.ejs
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

    //index.ejs - delete
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
```

### 6. Validate
```js
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

    //add.ejs
    <% if(typeof errors !='undefined') 
            {%>
                <% for(let err of errors) 
                    {%>
                        <h5 class="text-danger">
                            <%=err.msg%>
                        </h5>
                    <%} 
                %>

            <%} 
    %>
```
