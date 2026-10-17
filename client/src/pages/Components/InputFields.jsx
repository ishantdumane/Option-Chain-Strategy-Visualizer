import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import axios from "axios";

const underlyingAssets = [
  { symbol: "NIFTY",      instrumentKey: "NSE_INDEX|Nifty 50" },
  { symbol: "BANKNIFTY",  instrumentKey: "NSE_INDEX|Nifty Bank" },
  { symbol: "FINNIFTY",   instrumentKey: "NSE_INDEX|Nifty Fin Service" },
];

export default function InputFields(props) {
    const {
        selectedUnderlying,
        handleChangeUnderlying,
        selectedExpiry,
        handleChangeExpiry,
    } = props;

    const [expiries, setExpiries] = useState([]);    

    useEffect(() => {
            axios.get("http://localhost:3000/api/get-expiries", {
                params : {
                    underlyingInstrumentKey: selectedUnderlying
                }
            })
            .then((response) => {
                setExpiries(response.data.data);
            })
            .catch((err) => {
                console.log(err);
            });
        }, [selectedUnderlying]);

    return (
        <Box
        display="flex"
        flexDirection="column"
        gap={2}             /* spacing between the two fields */
        width="100%"        /* make sure the Box itself is full-width */
        >
        <TextField
            fullWidth         /* stretch to 100% of the parent Box */
            id="underlying-input"
            name="underlying"
            select
            label="Underlying"
            value={selectedUnderlying}
            helperText="Please select an underlying"
            onChange={handleChangeUnderlying}
        >
            {underlyingAssets.map((u) => (
            <MenuItem key={u.instrumentKey} value={u.instrumentKey}>
                {u.symbol}
            </MenuItem>
            ))}
        </TextField>

        <TextField
            fullWidth
            id="expiry-input"
            name="expiry"
            select
            label="Expiry"
            value={selectedExpiry}
            helperText="Please select an expiry"
            onChange={handleChangeExpiry}
        >
            {expiries.map((expiry) => (
            <MenuItem key={expiry} value={expiry}>
                {expiry}
            </MenuItem>
            ))}
        </TextField>
        </Box>
    );
}
