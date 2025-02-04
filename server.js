const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// In-memory storage
let users = [];              // Each user is stored as { userHandle, password }
let authorizedTokens = [];   // Valid tokens will be stored here
let highScores = [];         // High scores will be stored as { level, userHandle, score, timestamp }

// Signup endpoint
app.post("/signup", (req, res) => {
  // Destructure and reject if there are extra fields.
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
    return res.status(400).json({ message: "Invalid request body" });
  }
  
  // Check if the user already exists.
  const existingUser = users.find((u) => u.userHandle === userHandle);
  if (existingUser) {
    // If the password is the same, consider it a success.
    if (existingUser.password === password) {
      return res.status(201).json({ message: "User registered successfully" });
    } else {
      return res.status(400).json({ message: "Invalid request body" });
    }
  }
  
  // Register the new user.
  users.push({ userHandle, password });
  res.status(201).json({ message: "User registered successfully" });
});

// Login endpoint
app.post("/login", (req, res) => {
  // Enforce that the request body has exactly two fields: userHandle and password.
  const bodyKeys = Object.keys(req.body);
  if (
    bodyKeys.length !== 2 ||
    !bodyKeys.includes("userHandle") ||
    !bodyKeys.includes("password")
  ) {
    return res.status(400).json({ message: "Bad Request" });
  }
  
  const { userHandle, password } = req.body;
  
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
  
  // Find the user with matching credentials.
  const user = users.find((u) => u.userHandle === userHandle && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized, incorrect username or password" });
  }
  
  // Generate a simple token by concatenating userHandle with the current timestamp.
  const token = userHandle + Date.now();
  authorizedTokens.push(token);
  
  // Return the token in a JSON object with only the jsonWebToken field.
  res.status(200).json({ jsonWebToken: token });
});

// POST /high-scores endpoint
app.post("/high-scores", (req, res) => {
  // Validate the Authorization header.
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized, JWT token is missing or invalid" });
  }
  
  const token = authHeader.split(" ")[1];
  if (!authorizedTokens.includes(token)) {
    return res.status(401).json({ message: "Unauthorized, JWT token is missing or invalid" });
  }
  
  const { level, userHandle, score, timestamp } = req.body;
  // Validate required fields and their types.
  if (
    level === undefined ||
    userHandle === undefined ||
    score === undefined ||
    timestamp === undefined ||
    typeof level !== "string" ||
    typeof userHandle !== "string" ||
    typeof timestamp !== "string"
  ) {
    return res.status(400).json({ message: "Invalid request body" });
  }
  
  // Convert score to a number.
  const numericScore = parseInt(score, 10);
  if (isNaN(numericScore)) {
    return res.status(400).json({ message: "Invalid request body" });
  }
  
  // Create and store the high score entry.
  highScores.push({ level, userHandle, score: numericScore, timestamp });
  res.status(201).json({ message: "High score posted successfully" });
});

// GET /high-scores endpoint
app.get("/high-scores", (req, res) => {
  const { level, page } = req.query;
  
  if (!level || typeof level !== "string") {
    return res.status(400).json({ message: "Invalid request query" });
  }
  
  // Default page to 1 and validate.
  const pageNumber = page ? parseInt(page, 10) : 1;
  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ message: "Invalid request query" });
  }
  
  // Filter high scores by level.
  const levelScores = highScores.filter((entry) => entry.level === level);
  
  // Sort the scores in descending order.
  const sortedScores = [...levelScores].sort((a, b) => b.score - a.score);
  
  // Paginate results (20 per page).
  const paginatedScores = sortedScores.slice((pageNumber - 1) * 20, pageNumber * 20);
  res.status(200).json(paginatedScores);
});

// ------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

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