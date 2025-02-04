const express = require("express");
const app = express();
const port = process.env.PORT || 3000;


app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//
const jwt = require("jsonwebtoken");
const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;
app.use(passport.initialize());

const MYSECRETJWTKEY = "mysecret";

let users = {};
let scores = {};

passport.use(new BasicStrategy(function (userHandle, password, done) {
  const user = users[userHandle];
  if (user && user.password === password) {
    return done(null, { userHandle: user.userHandle });
  } else {
    return done(null, false);
  }
}));


app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;
  if (!userHandle || !password) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  users[userHandle] = { "userHandle": userHandle, "password": password };
  console.log("User registered successfully");
  console.log(users);

  res.status(201).json({ message: "User registered successfully" });

});

app.post("/login", passport.authenticate("basic", { session: false }), (req, res) => {
  const userHandle = req.user.userHandle;
  const token = jwt.sign({ userHandle: userHandle }, MYSECRETJWTKEY);
  res.status(200).json({ message: "Login successful, JWT token provided", jsonWebToken: token });
});

// Middleware to validate JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized, JWT token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, MYSECRETJWTKEY, (err, user) => {
        if (err) {
          return res.status(401).json({ message: 'Unauthorized, JWT token is missing or invalid' });
        }
        req.user = user;
        next();
    });
};

app.post("/high-scores", authenticateJWT, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;
  if (level == undefined || userHandle == undefined || score == undefined || timestamp == undefined) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  if (!scores[level]) {
    scores[level] = [];
  }
  scores[level].push( req.body);
  console.log("Score added successfully");
  console.log(scores);

  res.status(201).json({ message: "High score posted successfully" });
});

app.get("/high-scores", (req, res) => {
  const { level, page } = req.query;
  if (level==undefined) {
    return res.status(400).json({ message: "Invalid request query" });
  }

  if (scores[level]==undefined) {
    return res.status(404).json({ message: "No high scores found for the specified level" });
  }

  if (page) {
    res.status(200).json([scores[level][page-1]]);
  } else {
    res.status(200).json(scores[level]);
  }

});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};

// TODO: REMOVE THIS LINE BEFORE SUBMISSION
//module.exports.start();
