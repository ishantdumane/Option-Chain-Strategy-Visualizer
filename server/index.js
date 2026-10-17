import express from "express";
import cors from "cors";
import axios from "axios";
import { runStrategy } from "./runStrategy.mjs";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json({ limit: "1mb" }));

app.use(cors({ origin: 'http://localhost:5173' }));

app.get("/api/get-expiries", async (req, res) => {
  try {
    const { underlyingInstrumentKey } = req.query;
    const url = 'https://api.upstox.com/v2/expired-instruments/expiries';
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        Accept: 'application/json'
      },
      params: {
        instrument_key: underlyingInstrumentKey 
      }
    })
    console.log("Expiries fetched successfully!")
    res.json(response.data);
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Failed to fetch expiries" });
  }
});

app.get("/api/option-chain", async (req, res) => {
  try {
    const { underlyingInstrumentKey, expiryDate } = req.query;
    const url = 'https://api.upstox.com/v2/expired-instruments/option/contract';
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        Accept: 'application/json'
      },
      params: {
        instrument_key: underlyingInstrumentKey,
        expiry_date: expiryDate
      }
    });
    console.log("Chain fetched successfully!")
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch chain"});
  }
});

app.get("/api/get-chart-data", async (req, res) => {
  try {
    const { instrumentKey, interval, toDate, fromDate } = req.query;
    const url = `https://api.upstox.com/v2/expired-instruments/historical-candle/${instrumentKey}/${interval}/${toDate}/${fromDate}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        Accept: 'application/json'
      },
    });
    console.log("Chart Data fetched successfully!");
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch Chart Data"});
  }
});

app.get("/api/get-instrument-price", async (req, res) => {
  const { instrumentKey, date } = req.query;

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://api.upstox.com/v3/historical-candle/${instrumentKey}/days/1/${date}/${date}`,
    headers: { 
      'Accept': 'application/json'
    }
  };

  axios(config)
  .then((response) => {
    res.json(response.data.data.candles[0][4]);
  })
  .catch((error) => {
    console.error(`${error.message} for date: ${date}`);
    res.json(error);
  });
});

app.post("/api/run-strategy", async (req, res) => {
  const { expiry, candles } = req.body;
  try {
    const result = await runStrategy({ expiry, candles });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

