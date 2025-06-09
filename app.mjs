// app.mjs
import express from 'express';
import path from 'path';
import fs from 'fs';
import vpcRouter from './routes/vpc.mjs';
import routersRouter from './routes/routers.mjs'; // Import the routers module

const app = express();
const port = 3000;

// ensure the data directory exists
// Top-level setup before routes and listen
const dataDir = path.join('data');
try {
  fs.accessSync(dataDir);
} catch {
  fs.mkdirSync(dataDir, { recursive: true });
}

const vpcDir = path.join(dataDir, 'vpc');
try {
  fs.accessSync(vpcDir);
} catch {
  fs.mkdirSync(vpcDir, { recursive: true });
}

app.use(express.json());

// Import and use the vpcRouter
app.use('/vpc', vpcRouter);

// Import and use the routersRouter
app.use('/routers', routersRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
