//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const mysql = require('mysql');

const app = express();
app.set('view-engine', 'ejs');
app.use(express.static(__dirname + '/views')); //for the css files
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}));
//creating pool connection
const pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: 'Sarva#1992',
    database: 'anon'
});


// const users = []

app.get("/", function(req, res) {
    console.log(req.session.username);
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {

        res.render("index.ejs", {name: req.session.username});
    }
});

app.post("/", function(req, res) {
    var post = req.body.post;

    pool.getConnection(function(err, tempConn) {
        if (err) {
            tempConn.release();
            console.log("Error in connecting");
        }
        else {
            console.log("Connected");
            tempConn.query("insert into posts(p_des, by_uid) values(?, (select uid from users where username = ?))", [post, req.session.username], function(err, rows, fields) {
                tempConn.release();
                if (err) {
                    console.log("Error in post addition query");
                }
                else {
                    console.log("post addition successful");
                }
            });
        }
    });

    res.send(post);
});



app.get('/login', function(req, res) {
    if (req.session.username != undefined) {
        res.redirect('/');
    }
    else
        res.render("login.ejs");
});
app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    // if (users.find(item => item.username === username).password === password) {
    //     req.session.username = username;
    //     res.redirect('/');
    // }
    // else
    //     res.send("not not NIce");
    
    pool.getConnection(function(err, tempConn) {
        if (err) {
            tempConn.release();
            console.log("Error in connecting");
        }
        else {
            console.log("Connected");
            tempConn.query("select password from users where username = ?", [username], function(err, rows, fields) {
                tempConn.release();
                if (err) {
                    console.log("Error in user finding query");
                }
                else {
                    console.log(rows);
                    if (rows.length != 0) {
                        console.log("user finding successful");
                        if (rows[0].password === password) {
                            req.session.username = username;
                            res.redirect('/');
                        }
                        else {
                            res.send("Wrong password");
                        }
                    }
                    else {
                        console.log("User not found");
                        res.send("Username not registered");
                    }
                }
            });
        }
    });

});



app.get('/register', function(req, res) {
    res.render("register.ejs");
});
app.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var cnfpassword = req.body.cnfpassword;
    if (password !== cnfpassword)
        res.send("passwords dont match!!");
    else {
        // users.push({
        //     "username": username,
        //     "password": password
        // });

        pool.getConnection(function(err, tempConn) {
            if (err) {
                tempConn.release();
                console.log("Error in connecting");
            }
            else {
                console.log("Connected");
                tempConn.query("insert into users(username, password) values(?, ?)", [username, password], function(err, rows, fields) {
                    tempConn.release();
                    if (err) {
                        console.log("Error in user addition query");
                    }
                    else {
                        console.log("user addition successful");
                    }
                });
            }
        });

        res.redirect("/login");
    }
});


app.post('/logout', function(req, res) {
    req.session.username = undefined;
    res.redirect("/login");
});




app.listen(3000, function() {
    console.log("Server started on 3000");
});