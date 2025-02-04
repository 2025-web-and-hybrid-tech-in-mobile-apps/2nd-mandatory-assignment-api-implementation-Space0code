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
    return done(null, { userHandle: user.userHandle, password: user.password });
  } else {
    return done(null, false);
  }
}));


app.post("/signup", (req, res) => {
  const { userHandle, password, ...extraFields } = req.body;
  if (
    !userHandle ||
    !password ||
    typeof userHandle !== "string" ||
    typeof password !== "string" ||
    userHandle.length < 6 ||
    password.length < 6
  ) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  if (Object.keys(extraFields).length > 0) {
    return res.status(400).json({ message: "Invalid request body, extra fields detected" });
  }

  // If the user already exists…
  if (users[userHandle] !== undefined) {
    // …if the password is the same, consider it a success.
    if (users[userHandle].password === password) {
      return res.status(201).json({ message: "User registered successfully" });
    } else {
      // If the password is different then the request is invalid.
      return res.status(400).json({ message: "Invalid request body" });
    }
  }

  // Otherwise register the new user
  users[userHandle] = { userHandle, password };
  res.status(201).json({ message: "User registered successfully" });
});

app.post("/login", (req, res) => {
  // Enforce that no additional fields are sent.
  const bodyKeys = Object.keys(req.body);
  if (
    bodyKeys.length !== 2 ||
    !bodyKeys.includes("userHandle") ||
    !bodyKeys.includes("password")
  ) {
    return res.status(400).json({ message: "Bad Request" });
  }
  
  const userHandle = req.body.userHandle;
  const password = req.body.password;
  
  if (
    !userHandle ||
    !password ||
    typeof userHandle !== "string" ||
    typeof password !== "string" ||
    userHandle.length < 6 ||
    password.length < 6
  ) {
    return res.status(400).json({ message: "Bad Request" });
  }
  
  if (!users[userHandle] || users[userHandle].password !== password) {
    return res
      .status(401)
      .json({ message: "Unauthorized, incorrect username or password" });
  }
  
  const token = jwt.sign({ userHandle: userHandle }, MYSECRETJWTKEY);
  
  res.status(200).json({ jsonWebToken: token });
});

// Middleware to validate JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("Error with authHeader. authHeader =", authHeader);
        return res.status(401).json({ message: 'Unauthorized, JWT token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, MYSECRETJWTKEY, (err, user) => {
        if (err) {
          console.log("Error in authenticateJWT: ");
          return res.status(401).json({ message: 'Unauthorized, JWT token is missing or invalid' });
        }
        req.user = user;
        next();
    });
};

app.post("/high-scores", authenticateJWT, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;
  
  // Validate required fields and their types
  if (level == undefined || userHandle == undefined || score == undefined || timestamp == undefined ||
      typeof level !== "string" || typeof userHandle !== "string" || typeof timestamp !== "string") {
    return res.status(400).json({ message: "Invalid request body" });
  }
  
  const numericScore = parseInt(score, 10);
  if (isNaN(numericScore)) {
    return res.status(400).json({ message: "Invalid request body" });
  }
  
  // Prepare a new high score entry with the correct numeric score
  const highScoreEntry = { level, userHandle, score: numericScore, timestamp };
  
  if (!scores[level]) {
    scores[level] = [];
  }
  scores[level].push(highScoreEntry);
  
  res.status(201).json({ message: "High score posted successfully" });
});
app.get("/high-scores", (req, res) => {
  const { level, page } = req.query;
  
  // Validate level
  if (!level || typeof level !== "string") {
    return res.status(400).json({ message: "Invalid request query" });
  }
  
  // Default page to 1 and parse it
  const pageNumber = page ? parseInt(page, 10) : 1;
  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ message: "Invalid request query" });
  }
  
  // Use an empty array if no scores exist for the level
  const levelScores = scores[level] || [];
  
  // Sort scores in descending order and then paginate (20 per page)
  const sortedScores = [...levelScores].sort((a, b) => b.score - a.score);
  const paginatedScores = sortedScores.slice((pageNumber - 1) * 20, pageNumber * 20);
  
  res.status(200).json(paginatedScores);
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
