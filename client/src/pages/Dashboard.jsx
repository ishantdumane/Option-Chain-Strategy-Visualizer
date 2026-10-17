import React, { useState, useEffect } from "react";
import ChartComponent from "./Components/ChartComponent";
import InputFields from "./Components/InputFields";
import OptionChain from "./Components/OptionChain";
import { Box, TextField, Button } from "@mui/material";
import { useLocation } from "react-router";
import axios from "axios";

export default function Dashboard() {
    const { state } = useLocation();
    const [underlying, setUnderlying] = useState(state?.underlying);
    const [expiry, setExpiry] = useState(state?.expiry);
    const [instrumentKey, setInstrumentKey] = useState(null);
    const [tradingSymbol, setTradingSymbol] = useState(null);
    const [interval, setSelectedInterval] = useState("1minute");
    const [chartData, setChartData] = useState({ data:{candles:[]} })

    function getTwoMonthsBefore(dateString) {
        const inputDate = new Date(dateString);
        
        // Subtract 2 months
        inputDate.setMonth(inputDate.getMonth() - 2);

        // Format to YYYY-MM-DD
        const year = inputDate.getFullYear();
        const month = String(inputDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(inputDate.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    const handleChangeUnderlying = (event) => {
        setUnderlying(event.target.value);
    };

    const handleChangeExpiry = (event) => {
        setExpiry(event.target.value);
    };

    useEffect(() => {
        if (instrumentKey) {
            const startDate = getTwoMonthsBefore(expiry);

            axios.get("http://localhost:3000/api/get-chart-data", {
                params: {
                    instrumentKey: instrumentKey,
                    interval: interval,
                    toDate: expiry,
                    fromDate: startDate
                }
            })
            .then((response) => {
                setChartData(response.data);
            })
            .catch((err) => {
                console.log(err);
            });
        }
    }, [instrumentKey, interval]);

    return (
    <Box 
        display="flex" 
        height="100vh" 
        width="100vw"
        sx={{
        overflow: 'hidden',        // prevent any accidental scrollbars
        }}
    >
        {/* Left Panel: 20% width */}
        <Box
        flex="0 0 20%"              // lock at 20% of the parent
        display="flex"
        flexDirection="column"
        borderRight="1px solid #ccc"
        p={2}
        sx={{
            overflow: 'hidden',      // ensure OptionChain's scroll is only inside its own box
        }}
        >
        {/* Top: Form */}
        <Box mb={2}>
            <InputFields
            selectedUnderlying={underlying}
            handleChangeUnderlying={handleChangeUnderlying}
            selectedExpiry={expiry}
            handleChangeExpiry={handleChangeExpiry}
            // pass fullWidth down so both selects fill 100% of the available space:
            sx={{ 
                '& .MuiInputBase-root': { width: '100%' }, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2 
            }}
            />
        </Box>

        {/* Bottom: Option Chain */}
        <Box flex={1} overflow="auto">
            <OptionChain 
            underlying={underlying}
            expiry={expiry}
            setInstrumentKey={setInstrumentKey}
            setTradingSymbol={setTradingSymbol}
            />
        </Box>
        </Box>

        {/* Right Panel: 80% width */}
        <Box 
        flex="1 1 0"   // fill remaining space
        p={2}
        sx={{
            padding: 0,                // remove default padding if you really want none
            overflow: 'hidden',        // chart itself handles its own scrolling if needed
        }}
        >
        <ChartComponent
        expiry={expiry}
        data={chartData} 
        interval={interval} 
        tradingSymbol={tradingSymbol}
        handleIntervalChange={setSelectedInterval}
        />
        </Box>
    </Box>
    );

}
