import React from "react";
import './Home.css';
import InputFields from "./Components/InputFields";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useState, useEffect } from "react";
import axios from "axios";
import { Form, useNavigate } from "react-router";

const underlyingAssets = [
    {
        symbol: "NIFTY",
        instrumentKey: "NSE_INDEX|Nifty 50"
    },
    {
        symbol: "BANKNIFTY",
        instrumentKey: "NSE_INDEX|Nifty Bank"
    },
    {
        symbol: "FINNIFTY",
        instrumentKey: "NSE_INDEX|Nifty Fin Service"
    }
]

export default function Home() {

    const navigate = useNavigate();
    const [selectedUnderlying, setUnderlying] = useState(underlyingAssets[0].instrumentKey);
    const [selectedExpiry, setSelectedExpiry] = useState('');
    const [expiries, setExpiries] = useState([]);

    const handleChangeUnderlying = (event) => {
        setUnderlying(event.target.value);
    };

    const handleChangeExpiry = (event) => {
        setSelectedExpiry(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const underlying = selectedUnderlying;
        const expiry = selectedExpiry;
        navigate("/dashboard", { state: {
            underlying,
            expiry
        } })
    }

    return (
        <div className="centerContainer">
            <Box
                component={Form}
                onSubmit={handleSubmit}
                className="formContainer"
                noValidate
                autoComplete="off"
                >
                <InputFields
                selectedUnderlying={selectedUnderlying}
                handleChangeUnderlying={handleChangeUnderlying}
                selectedExpiry={selectedExpiry}
                handleChangeExpiry={handleChangeExpiry}
                />
                <Button type="submit" variant="contained">
                    View Option Chain
                </Button>
            </Box>
        </div>
    )
}