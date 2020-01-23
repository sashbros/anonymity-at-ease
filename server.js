//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const uuidv1 = require('uuid/v1');
const sha1 = require('sha1');

const app = express();
app.set('view-engine', 'ejs');
app.use(express.static(__dirname + '/views')); //for the css files
app.use(express.static(__dirname + '/images')); //for images
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 1000* 60 * 60 *24 * 365
}));
app.use(fileUpload());

//creating pool connection
// const pool = mysql.createPool({
//     connectionLimit: 20,
//     host: 'localhost',
//     user: 'root',
//     password: 'Sarva#1992',
//     database: 'anon',
//     charset: 'utf8mb4'
// });
const pool = mysql.createPool({
    connectionLimit: 1,
    host: 'remotemysql.com',
    user: 'Pcz4fSl6O4',
    password: 'gCjU1z4l5f',
    database: 'Pcz4fSl6O4',
    charset: 'utf8mb4'
});
// var ajaxPost = "";
// const users = []

app.get("/", function(req, res) {
    // console.log(req.session.username);
    //var image = "s.jpg";
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {

        pool.getConnection(function(err, tempConn) {
            if (err) {
                tempConn.release();
                // console.log("Error in connecting");
            }
            else {
                // console.log("Connected");
                tempConn.query("select u.uid, p.pid, p.p_des, u.username, p.upvotes, p.downvotes, p.p_image from posts p join users u on u.uid = p.by_uid where p.upvotes-p.downvotes>-10 order by p.pid desc;", function(err, rows, fields) {
                    //tempConn.release();
                    if (err) {
                        // console.log("Error in search all posts query");
                    }
                    else {
                        // console.log("search all posts successful");
                        tempConn.query("select u.username, up.pid from upvotes up join users u on u.uid = up.uid", function(err, upvoteRows, fields) {
                            // tempConn.release();
                            if (err) {
                                // console.log("Error in selecting from upvotes query");
                            }
                            else {
                                // console.log("selecting from upvotes successful");
                                tempConn.query("select (select count(uid) from users) as userCount, (select count(pid) from posts) as postCount from dual", function(err, countRows, fields) {
                                    tempConn.release();
                                    if (err) {
                                        // console.log("Error in count users-post query");
                                    }
                                    else {
                                        // console.log("count users-post successful");
                                        var userCount = countRows[0].userCount;
                                        var postCount = countRows[0].postCount;
                                        res.render("index.ejs", {name: req.session.username, data: rows, upvoteData: upvoteRows, userCount: userCount, postCount: postCount});
                                    }
                                });


                                //res.render("index.ejs", {name: req.session.username, data: rows, upvoteData: upvoteRows});
                            }

                        });


                        //res.render("index.ejs", {name: req.session.username, data: rows});
                    }
                });
            }
        });


        
    }
});

app.post("/", function(req, res) {
    var post = req.body.post;
    // console.log(post);
    var image;
    if (req.files) {
        // console.log("This is req files" + req.files);
        image = uuidv1() + req.files.image.name;
        req.files.image.mv('./images/' + image, function(err) {
            if (err) {
                // console.log(err);
            }
            else {
                // console.log("image Uploaded to images/");
            }
        });
    }
    // console.log("This is image variable" + image);
    // ajaxPost = post;

    pool.getConnection(function(err, tempConn) {
        if (err) {
            tempConn.release();
            // console.log("Error in connecting");
        }
        else {
            // console.log("Connected");
            tempConn.query("insert into posts(p_des, by_uid, p_image) values(?, (select uid from users where username = ?), ?)", [post, req.session.username, image], function(err, rows, fields) {
                tempConn.release();
                if (err) {
                    // console.log("Error in post addition query");
                }
                else {
                    // console.log("post addition successful");
                    res.redirect('/posted');
                }
            });
        }
    });

    
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
    username = username.toLowerCase();
    var password = req.body.password;
    password = sha1(password);
    // if (users.find(item => item.username === username).password === password) {
    //     req.session.username = username;
    //     res.redirect('/');
    // }
    // else
    //     res.send("not not NIce");
    
    pool.getConnection(function(err, tempConn) {
        if (err) {
            tempConn.release();
            // console.log("Error in connecting");
        }
        else {
            // console.log("Connected");
            tempConn.query("select password from users where username = ?", [username], function(err, rows, fields) {
                tempConn.release();
                if (err) {
                    // console.log("Error in user finding query");
                }
                else {
                    // console.log(rows);
                    if (rows.length != 0) {
                        // console.log("user finding successful");
                        if (rows[0].password === password) {
                            req.session.username = username;
                            res.redirect("/");
                        }
                        else {
                            res.send("Wrong password");
                        }
                    }
                    else {
                        // console.log("User not found");
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
    username = username.toLowerCase();
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
                // console.log("Error in connecting");
            }
            else {
                // console.log("Connected");
                tempConn.query("select uid from users where username=?", [username], function(err, userrow, fields) {
                    if (err) {
                        // console.log("error in user duplicate checking query");
                    }
                    else {
                        // console.log("user duplicate checking query successful");
                        if (userrow.length != 0) {
                            res.send("Username is already used");
                        }
                        else {
                            password = sha1(password);
                            tempConn.query("insert into users(username, password) values(?, ?)", [username, password], function(err, rows, fields) {
                                tempConn.release();
                                if (err) {
                                    // console.log("Error in user addition query");
                                }
                                else {
                                    // console.log("user addition successful");
                                    res.redirect("/login");
                                }
                            });
                        }
                    }
                });


                
            }
        });

        
    }
});


app.post('/logout', function(req, res) {
    req.session.username = undefined;
    res.redirect("/login");
});


app.get('/posted', function(req, res) {
    res.redirect("/");
});

app.post('/upvote', function(req, res) {
    var pid = req.body.upvoteText;
    var uid;

    pool.getConnection(function(err, tempConn) {
        if (err) {
            tempConn.release();
            // console.log("Error in connecting");
        }
        else {
            // console.log("Connected");
            tempConn.query("update posts set upvotes=upvotes+1 where pid=?", [pid], function(err, rows, fields) {
                // tempConn.release();
                if (err) {
                    // console.log("Error in upvoting query");
                }
                else {
                    // console.log("upvoting successful in posts table");
                    tempConn.query("select uid from users where username=?", [req.session.username], function(err, rows, fields) {
                        if (err) {
                            // console.log("Error in retreiving uid");
                        }
                        else {
                            // console.log("retreiving uid successful");
                            uid = rows[0].uid;
                            tempConn.query("insert into upvotes values (?, ?)", [uid, pid], function(err, rows, fields) {
                                tempConn.release();
                                if (err) {
                                    // console.log("Error in adding upvotes");
                                }
                                else {
                                    // console.log("adding in upvotes successful");
                                    res.redirect("back");
                                }
                            });
                        }
                    });

                }
            });
        }
    });

});


app.post('/downvote', function(req, res) {
    var pid = req.body.downvoteText;
    var uid;

    pool.getConnection(function(err, tempConn) {
        if (err) {
            tempConn.release();
            // console.log("Error in connecting");
        }
        else {
            // console.log("Connected");
            tempConn.query("update posts set downvotes=downvotes+1 where pid=?", [pid], function(err, rows, fields) {
                // tempConn.release();
                if (err) {
                    // console.log("Error in downvoting query");
                }
                else {
                    // console.log("downvoting successful in posts table");
                    tempConn.query("select uid from users where username=?", [req.session.username], function(err, rows, fields) {
                        if (err) {
                            // console.log("Error in retreiving uid");
                        }
                        else {
                            // console.log("retreiving uid successful");
                            uid = rows[0].uid;
                            tempConn.query("insert into upvotes values (?, ?)", [uid, pid], function(err, rows, fields) {
                                tempConn.release();
                                if (err) {
                                    // console.log("Error in adding downvotes");
                                }
                                else {
                                    // console.log("adding in downvotes successful");
                                    res.redirect("back");
                                }
                            });
                        }
                    });

                }
            });
        }
    });

});

// app.get('/users/:username', function(req, res) {
//     if (req.session.username == undefined) {
//         res.redirect("/login");
//     }
//     else if (req.session.username === req.params.username) {
//         res.redirect('/home');
//     }
//     else {
//         res.send('Welcome to ' + req.params.username + 's profile');
//     }
// });
app.post('/users/:username', function(req, res) {
    res.redirect('/users/' + req.params.username);
});

app.get('/users/:username', function(req, res) {
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else if (req.session.username !== req.params.username) {
        res.render('stayout.ejs', {name: req.session.username});
    }
    else {
        pool.getConnection(function(err, tempConn) {
            if (err) {
                tempConn.release();
                // console.log("Error in connecting");
            }
            else {
                // console.log("Connected");
                tempConn.query("select uid from users where username=?", [req.params.username], function(err, userFindRow, fields) {
                    if (err) {
                        // console.log("error in finding user at home query");
                    }
                    else {
                        if (userFindRow.length == 0) {
                            res.render('pageNotFound.ejs', {name: req.session.username});
                        }
                        else {
                            tempConn.query("select 2*count(u.username) as exp_points, 2*count(u.username)+sum(p.upvotes-2*p.downvotes) as rep_points from users u join posts p on u.uid=p.by_uid where username=?", [req.params.username], function(err, ptsrows, fields) {
                                //tempConn.release();
                                if (err) {
                                    // console.log("Error in exp and rep pts query");
                                }
                                else {
                                    // console.log("exp and rep pts successful");
                                    //res.render('home.ejs', {name: req.session.username, data: rows});
                                    tempConn.query("select u.uid, p.pid, p.p_des, u.username, p.upvotes, p.downvotes, p.p_image from posts p join users u on u.uid = p.by_uid where p.upvotes-p.downvotes>-10 and u.username=? order by p.pid desc;", [req.params.username], function(err, rows, fields) {
                                        //tempConn.release();
                                        if (err) {
                                            // console.log("Error in search all posts query");
                                        }
                                        else {
                                            // console.log("search all posts successful");
                                            tempConn.query("select u.username, up.pid from upvotes up join users u on u.uid = up.uid", function(err, upvoteRows, fields) {
                                                // tempConn.release();
                                                if (err) {
                                                    // console.log("Error in selecting from upvotes query");
                                                }
                                                else {
                                                    // console.log("selecting from upvotes successful");
                                                    tempConn.query("select (select count(uid) from users) as userCount, (select count(pid) from posts) as postCount from dual", function(err, countRows, fields) {
                                                        tempConn.release();
                                                        if (err) {
                                                            // console.log("Error in count users-post query");
                                                        }
                                                        else {
                                                            // console.log("count users-post successful");
                                                            var userCount = countRows[0].userCount;
                                                            var postCount = countRows[0].postCount;
                                                            res.render("home.ejs", {name: req.session.username, pageName: req.params.username, ptsrows: ptsrows, data: rows, upvoteData: upvoteRows, userCount: userCount, postCount: postCount});
                                                        }
                                                    });
                    
                    
                                                    
                                                }
                    
                                            });
                    
                    
                                           
                                        }
                                    });
            
            
            
            
                                }
                            });
                        }
                    }
                });
    


                
            }
        });
    }
    
});
// app.post('/home', function(req, res) {
//     res.redirect('/home');
// });

app.post('/warzone', function(req, res) {
    res.redirect('/');
});



app.get('/polls', function(req, res) {
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {
        res.render('polls.ejs', {name: req.session.username});
    }
});
app.post('/polls', function(req, res) {
    res.redirect('/polls');
});

app.post('/pollcreated', function(req, res) {
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {
        var question = req.body.question;
        pool.getConnection(function(err, tempConn) {
            if (err) {
                tempConn.release();
                // console.log("Error in connecting");
            }
            else {
                // console.log("Connected");
                tempConn.query("insert into polls(poll_ques) values(?)", [question], function(err, rows, fields) {
                    tempConn.release();
                    if (err) {
                        // console.log("error in poll insertion query");
                    }
                    else {
                        // console.log("poll insertion successful");
                        res.redirect("/question/" + question);
                    }
                });
            }
        
        });
        
    }
    
});
app.get('/question/:question', function(req, res) {
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {
        var question = req.params.question;
        
        pool.getConnection(function(err, tempConn) {
            if (err) {
                tempConn.release();
                // console.log("Error in connecting");
            }
            else {
                // console.log("Connected");
                tempConn.query("select pollid, num_yes, num_no from polls where poll_ques=?", [question], function(err, rows, fields) {
                    // tempConn.release();
                    if (err) {
                        // console.log("error in searching pollid query");
                    }
                    else {
                        // console.log("pollid search successful");
                        if (rows.length == 0) {
                            res.render('pageNotFound.ejs', {name: req.session.username});
                        }
                        else {
                            tempConn.query("select uid from users where username=?", [req.session.username], function(err, userrows,fields) {
                                // tempConn.release();
                                if (err) {
                                    // console.log("error in finding username uid query");
                                }
                                else {
                                    // console.log("username uid finding successful");
                                    var pollid = rows[0].pollid;
                                    var uid = userrows[0].uid;
                                    tempConn.query("select uid from pollvotes where uid=? and pollid=?", [uid, pollid], function(err, finalrows, fields) {
                                        tempConn.release();
                                        if (err) {
                                            // console.log("error in finding pollvotes query");
                                        }
                                        else {
                                            // console.log("finding pollvotes successful");
                                            res.render('votingpolls.ejs', {name: req.session.username, question: question, data: rows, finalrows: finalrows});
                                        }
                                    });
    
                                    
    
                                }
                            });
                        }
                        


                        
                    }
                });
            }
        
        });


       
    }
});

app.post('/votesubmitted', function(req, res) {
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {
        var option = req.body.option;
        var pollid = req.body.pollidtext;
        // console.log(option);
        if (option == "yes") {
            pool.getConnection(function(err, tempConn) {
                if (err) {
                    tempConn.release();
                    // console.log("Error in connecting");
                }
                else {
                    // console.log("Connected");

                    tempConn.query("update polls set num_yes=num_yes+1 where pollid=?", [pollid], function(err, numyesrow, fields) {
                        if (err) {
                            // console.log("error updating num yes query");
                        }
                        else {
                            // console.log("updating num yes successful");
                            tempConn.query("select uid from users where username=?", [req.session.username], function(err, userrows, fields) {
                                if (err) {
                                    // console.log("error in finding username uid query");
                                }
                                else {
                                    // console.log("finding username uid successful");
                                    var uid = userrows[0].uid;
                                    tempConn.query("insert into pollvotes values(?, ?)", [uid, pollid], function(err, rows, fields) {
                                        tempConn.release();
                                        if (err) {
                                            // console.log("error in poll insertion query");
                                        }
                                        else {
                                            // console.log("poll insertion successful");
                                            res.redirect("back");
                                        }
                                    });
                                }
                            });

                        }
                    });
                    
                }
            
            });
        }
        else {
            pool.getConnection(function(err, tempConn) {
                if (err) {
                    tempConn.release();
                    // console.log("Error in connecting");
                }
                else {
                    // console.log("Connected");

                    tempConn.query("update polls set num_no=num_no+1 where pollid=?", [pollid], function(err, numnorow, fields) {
                        if (err) {
                            // console.log("error updating num yes query");
                        }
                        else {
                            // console.log("updating num yes successful");
                            tempConn.query("select uid from users where username=?", [req.session.username], function(err, userrows, fields) {
                                if (err) {
                                    // console.log("error in finding username uid query");
                                }
                                else {
                                    // console.log("finding username uid successful");
                                    var uid = userrows[0].uid;
                                    tempConn.query("insert into pollvotes values(?, ?)", [uid, pollid], function(err, rows, fields) {
                                        tempConn.release();
                                        if (err) {
                                            // console.log("error in poll insertion query");
                                        }
                                        else {
                                            // console.log("poll insertion successful");
                                            res.redirect("back");
                                        }
                                    });
                                }
                            });

                        }
                    });
                    
                }
            
            });
        }
    }
});



app.get('/sortbyvotes', function(req, res) {
    // console.log(req.session.username);
    //var image = "s.jpg";
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {

        pool.getConnection(function(err, tempConn) {
            if (err) {
                tempConn.release();
                // console.log("Error in connecting");
            }
            else {
                // console.log("Connected");
                tempConn.query("select u.uid, p.pid, p.p_des, u.username, p.upvotes, p.downvotes, p.p_image from posts p join users u on u.uid = p.by_uid where p.upvotes-p.downvotes>-10 order by p.upvotes-p.downvotes desc;", function(err, rows, fields) {
                    //tempConn.release();
                    if (err) {
                        // console.log("Error in search all posts query");
                    }
                    else {
                        // console.log("search all posts successful");
                        tempConn.query("select u.username, up.pid from upvotes up join users u on u.uid = up.uid", function(err, upvoteRows, fields) {
                            // tempConn.release();
                            if (err) {
                                // console.log("Error in selecting from upvotes query");
                            }
                            else {
                                // console.log("selecting from upvotes successful");
                                tempConn.query("select (select count(uid) from users) as userCount, (select count(pid) from posts) as postCount from dual", function(err, countRows, fields) {
                                    tempConn.release();
                                    if (err) {
                                        // console.log("Error in count users-post query");
                                    }
                                    else {
                                        // console.log("count users-post successful");
                                        var userCount = countRows[0].userCount;
                                        var postCount = countRows[0].postCount;
                                        res.render("sortbyvotes.ejs", {name: req.session.username, data: rows, upvoteData: upvoteRows, userCount: userCount, postCount: postCount});
                                    }
                                });


                                //res.render("index.ejs", {name: req.session.username, data: rows, upvoteData: upvoteRows});
                            }

                        });


                        //res.render("index.ejs", {name: req.session.username, data: rows});
                    }
                });
            }
        });


        
    }
});



app.use(function(req, res, next) {
    // res.redirect('/');
    if (req.session.username == undefined) {
        res.redirect("/login");
    }
    else {
        res.render('pageNotFound.ejs', {name: req.session.username});
    }
  });
app.listen(3000, function() {
    // console.log("Server started on 3000");
});