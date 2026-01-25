import { type Exercise } from "@shared/schema";

const commonSetup = `
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY, 
  name TEXT, 
  age INT, 
  city TEXT,
  email TEXT
);

INSERT INTO users (name, age, city, email) VALUES 
  ('Alice', 25, 'New York', 'alice@example.com'), 
  ('Bob', 30, 'San Francisco', 'bob@test.com'), 
  ('Charlie', 35, 'New York', 'charlie@example.com'), 
  ('David', 28, 'Chicago', 'david@test.com'),
  ('Eve', 22, 'San Francisco', 'eve@example.com');

CREATE TABLE orders (
  id SERIAL PRIMARY KEY, 
  user_id INT, 
  amount INT, 
  item TEXT,
  order_date DATE
);

INSERT INTO orders (user_id, amount, item, order_date) VALUES 
  (1, 100, 'Laptop', '2023-01-10'), 
  (1, 50, 'Mouse', '2023-01-15'), 
  (2, 200, 'Monitor', '2023-02-01'), 
  (4, 75, 'Keyboard', '2023-02-10'),
  (4, 150, 'Printer', '2023-02-20'),
  (1, 120, 'Desk', '2023-03-01');
`;

export const exercisesData: Exercise[] = [
  {
    id: 1,
    title: "Select All Users",
    description: "Retrieve all columns from the 'users' table.",
    setupSql: commonSetup,
    solutionSql: "SELECT * FROM users;",
    hint: "Use SELECT * to get all columns.",
    order: 1,
  },
  {
    id: 2,
    title: "Filter by City",
    description: "Find all users who live in 'New York'.",
    setupSql: commonSetup,
    solutionSql: "SELECT * FROM users WHERE city = 'New York';",
    hint: "Use the WHERE clause.",
    order: 2,
  },
  {
    id: 3,
    title: "Sort by Age",
    description: "List all users sorted by age in descending order (oldest first).",
    setupSql: commonSetup,
    solutionSql: "SELECT * FROM users ORDER BY age DESC;",
    hint: "Use ORDER BY and DESC.",
    order: 3,
  },
  {
    id: 4,
    title: "Count Users",
    description: "Count how many users are in the table.",
    setupSql: commonSetup,
    solutionSql: "SELECT COUNT(*) FROM users;",
    hint: "Use the COUNT() aggregate function.",
    order: 4,
  },
  {
    id: 5,
    title: "Specific Columns",
    description: "Select only the 'name' and 'email' of users who are older than 25.",
    setupSql: commonSetup,
    solutionSql: "SELECT name, email FROM users WHERE age > 25;",
    hint: "Specify column names after SELECT.",
    order: 5,
  },
  {
    id: 6,
    title: "Total Orders per User",
    description: "Find the total amount spent by each user. Return 'user_id' and 'total_amount'.",
    setupSql: commonSetup,
    solutionSql: "SELECT user_id, SUM(amount) as total_amount FROM orders GROUP BY user_id;",
    hint: "Use GROUP BY and SUM().",
    order: 6,
  },
  {
    id: 7,
    title: "Join Users and Orders",
    description: "List all orders with the name of the user who made them. Return 'name' (from users) and 'item' (from orders).",
    setupSql: commonSetup,
    solutionSql: "SELECT users.name, orders.item FROM orders JOIN users ON orders.user_id = users.id;",
    hint: "Use JOIN ... ON ...",
    order: 7,
  },
  {
    id: 8,
    title: "Filter Aggregates (HAVING)",
    description: "Find user_ids that have spent more than 100 in total.",
    setupSql: commonSetup,
    solutionSql: "SELECT user_id FROM orders GROUP BY user_id HAVING SUM(amount) > 100;",
    hint: "Use HAVING after GROUP BY to filter aggregates.",
    order: 8,
  },
  {
    id: 9,
    title: "Users Without Orders",
    description: "Find the names of users who have effectively placed zero orders (they are not in the orders table).",
    setupSql: commonSetup,
    solutionSql: "SELECT name FROM users WHERE id NOT IN (SELECT user_id FROM orders);",
    hint: "Use NOT IN with a subquery, or LEFT JOIN.",
    order: 9,
  },
  {
    id: 10,
    title: "Complex Challenge",
    description: "List the name of the user who made the most expensive single order.",
    setupSql: commonSetup,
    solutionSql: "SELECT name FROM users JOIN orders ON users.id = orders.user_id ORDER BY amount DESC LIMIT 1;",
    hint: "Order by amount descending and take the top 1.",
    order: 10,
  },
];
