import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {handlePREvent} from "./pr-handler";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// GitHub webhook endpoint
app.post('/webhook', (req: Request, res: Response) => {
  const event = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];
  const signature = req.headers['x-hub-signature'];
  const payload = req.body;

  // console.log(`Received event: ${event}`);
  // console.log(`Delivery ID: ${deliveryId}`);
  // console.log(`Signature: ${signature}`);
  // console.log('Payload:', payload);

  handlePREvent(payload);

  // Respond to GitHub
  res.status(200).send('Webhook received');

});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});